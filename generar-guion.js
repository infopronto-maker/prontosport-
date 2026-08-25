// ============================================================
// generar-guion.js - Genera HTML con Gemini (definitivo)
// ============================================================

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
    fecha: new Date(partido.fixture.date).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric'
    }),
    estadio: partido.fixture.venue.name || 'Dato no disponible',
    liga: partido.league.name,
    ganador: partido.teams.home.winner ? partido.teams.home.name :
              partido.teams.away.winner ? partido.teams.away.name : 'Empate'
  };
}

async function generarHTML(json) {
  const prompt = `Eres diseñador de videos. Genera HTML para video de 10s con estos datos:
${JSON.stringify(json, null, 2)}

Reglas:
- Formato vertical 1080x1920, fondo #0a0a1a, texto blanco, rojo #e94560.
- Incluye: TITULAR (8 palabras), EQUIPOS, MARCADOR, RESUMEN (20 palabras), GANCHO (10 palabras).
- Usa animaciones CSS: fadeIn, slideUp.
- Cada elemento con data-duration y data-delay.
- Duración total: 12s.

Responde SOLO con el HTML completo.`;

  return await llamarGemini(prompt);
}

async function main() {
  console.log('🚀 Generando HTML con Gemini...');
  const partidos = await traerPartidosDelDia();
  if (!partidos.length) {
    console.log('⚠️ No hay partidos');
    return;
  }

  const resultados = [];
  for (const p of partidos) {
    console.log(`📊 ${p.teams.home.name} vs ${p.teams.away.name}`);
    const json = construirJSON(p);
    const html = await generarHTML(json);
    resultados.push({ ...json, html });
  }

  const dir = config.RUTAS.DATOS;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'partidos-html.json'), JSON.stringify(resultados, null, 2));
  console.log(`✅ HTML guardado (${resultados.length} partidos)`);
}

if (require.main === module) main();
module.exports = { generarHTML, construirJSON };
