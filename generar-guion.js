require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require('./config.js');

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function esperar(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function llamarApiFootball(endpoint, params = {}) {
  const url = new URL(`https://v3.football.api-sports.io${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url, { headers: { 'x-apisports-key': API_FOOTBALL_KEY } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function llamarGemini(prompt, intentos = 1) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.GEMINI.MODELO}:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: config.GEMINI.TEMPERATURA, maxOutputTokens: config.GEMINI.MAX_TOKENS }
      })
    });
    const data = await res.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    if (data.error?.code === 429 && intentos < config.GEMINI.INTENTOS_MAX) {
      const espera = Math.min(60000 * Math.pow(2, intentos - 1), 180000);
      console.log(`⚠️ Cuota agotada, esperando ${espera/1000}s... (${intentos}/${config.GEMINI.INTENTOS_MAX})`);
      await esperar(espera);
      return llamarGemini(prompt, intentos + 1);
    }
    throw new Error(`Gemini error: ${JSON.stringify(data)}`);
  } catch (e) {
    if (intentos < config.GEMINI.INTENTOS_MAX) {
      await esperar(5000);
      return llamarGemini(prompt, intentos + 1);
    }
    throw e;
  }
}

async function traerPartidosDelDia() {
  const ligasIds = [];
  for (const obj of config.LIGAS_OBJETIVO) {
    try {
      const data = await llamarApiFootball('/leagues', { search: obj.busqueda });
      if (data.response?.length) {
        let elegido = data.response[0];
        if (obj.pais) {
          const match = data.response.find(r => r.country?.name === obj.pais);
          if (match) elegido = match;
        }
        ligasIds.push(elegido.league.id);
      }
    } catch (e) { console.error(e.message); }
  }

  const fechas = [];
  for (let i = 0; i < config.DIAS_BUSQUEDA; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    fechas.push(d.toISOString().split('T')[0]);
  }

  let todos = [];
  for (const fecha of fechas) {
    try {
      const data = await llamarApiFootball('/fixtures', { date: fecha, status: 'FT' });
      if (data.response) todos = todos.concat(data.response);
    } catch (e) { console.error(e.message); }
  }

  const unicos = [];
  const vistos = new Set();
  for (const p of todos) {
    if (!vistos.has(p.fixture.id)) { vistos.add(p.fixture.id); unicos.push(p); }
  }

  const filtrados = unicos.filter(p => {
    const local = p.teams.home.name.toLowerCase();
    const visit = p.teams.away.name.toLowerCase();
    return config.EQUIPOS_PRIORITARIOS.some(e =>
      local.includes(e.toLowerCase()) || visit.includes(e.toLowerCase())
    );
  });

  if (filtrados.length === 0) {
    const colombia = unicos.filter(p =>
      p.teams.home.name.toLowerCase().includes('colombia') ||
      p.teams.away.name.toLowerCase().includes('colombia')
    );
    const prioritarios = unicos.filter(p =>
      ligasIds.includes(p.league.id) && !colombia.includes(p)
    );
    return [...colombia, ...prioritarios].slice(0, config.MAX_PIEZAS);
  }

  return filtrados.slice(0, config.MAX_PIEZAS);
}

function construirJSON(partido) {
  return {
    partido_id: partido.fixture.id,
    local: partido.teams.home.name,
    visitante: partido.teams.away.name,
    resultado: `${partido.goals.home}-${partido.goals.away}`,
    marcadorLocal: partido.goals.home,
    marcadorVisitante: partido.goals.away,
    fecha: new Date(partido.fixture.date).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric'
    }),
    estadio: partido.fixture.venue.name || 'Dato no disponible',
    liga: partido.league.name,
    ganador: partido.teams.home.winner ? partido.teams.home.name :
              partido.teams.away.winner ? partido.teams.away.name : 'Empate'
  };
}

// Gemini SOLO devuelve texto creativo, nunca cifras del marcador — esas van directo del JSON real.
async function generarTextos(json) {
  const prompt = `Datos del partido: ${JSON.stringify(json, null, 2)}

Responde SOLO con un JSON válido, sin markdown, con esta forma exacta:
{"titular": "máximo 8 palabras, sin mencionar el marcador", "resumen": "máximo 20 palabras sobre por qué importa el resultado", "gancho": "máximo 10 palabras, pregunta táctica para invitar a comentar"}

No inventes cifras que no estén en los datos.`;

  const texto = await llamarGemini(prompt);
  const limpio = texto.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(limpio);
  } catch (e) {
    console.log('⚠️ Gemini no devolvió JSON válido, usando textos por defecto:', texto);
    return {
      titular: `${json.local} vs ${json.visitante}`,
      resumen: `${json.ganador === 'Empate' ? 'Partido terminado en empate' : json.ganador + ' se quedó con la victoria'}.`,
      gancho: '¿Qué opinas de este resultado?',
    };
  }
}

// El HTML lo arma el código, no Gemini — el marcador y los nombres son datos exactos, no texto generado.
function construirHTML(json, textos) {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: #0a0a1a;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: Arial, sans-serif;
      color: white;
      flex-direction: column;
      padding: 20px;
    }
    .titular { font-size: 38px; font-weight: bold; color: #e94560; text-align: center; animation: fadeIn 1s ease-out; }
    .equipos { display: flex; align-items: center; gap: 30px; margin: 20px 0; font-size: 36px; font-weight: bold; }
    .marcador { font-size: 52px; color: #e94560; font-weight: bold; }
    .resumen { font-size: 22px; color: #ccd6f6; text-align: center; max-width: 800px; animation: fadeIn 2s ease-out; }
    .gancho { font-size: 26px; color: #e94560; font-weight: bold; text-align: center; margin-top: 20px; animation: fadeIn 2.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body>
  <div class="titular" data-duration="2s">${textos.titular}</div>
  <div class="equipos" data-delay="1s" data-duration="2s">
    <span>${json.local.toUpperCase()}</span>
    <span class="marcador">${json.marcadorLocal} - ${json.marcadorVisitante}</span>
    <span>${json.visitante.toUpperCase()}</span>
  </div>
  <div class="resumen" data-delay="2.5s" data-duration="3s">${textos.resumen}</div>
  <div class="gancho" data-delay="5s" data-duration="2s">${textos.gancho}</div>
</body>
</html>`;
}

async function main() {
  console.log('🚀 Generando textos con Gemini y armando HTML...');
  const partidos = await traerPartidosDelDia();
  if (!partidos.length) {
    console.log('⚠️ No hay partidos');
    return;
  }

  const resultados = [];
  for (const p of partidos) {
    console.log(`📊 ${p.teams.home.name} vs ${p.teams.away.name}`);
    const json = construirJSON(p);
    const textos = await generarTextos(json);
    const html = construirHTML(json, textos);
    resultados.push({ ...json, ...textos, html });
  }

  const dir = config.RUTAS.DATOS;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'partidos-html.json'), JSON.stringify(resultados, null, 2));
  console.log(`✅ HTML guardado (${resultados.length} partidos)`);
}

if (require.main === module) main();
module.exports = { construirHTML, construirJSON };
