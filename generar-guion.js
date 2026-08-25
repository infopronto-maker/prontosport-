// ============================================================
// generar-guion.js - Genera contenido con Gemini (FÚTBOL LATINO)
// ============================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require('./config.js');

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ---------- UTILIDADES ----------
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function obtenerFechas(dias) {
  const fechas = [];
  for (let i = 0; i < dias; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    fechas.push(d.toISOString().split('T')[0]);
  }
  return fechas;
}

// ---------- API CLIENT ----------
async function llamarApiFootball(endpoint, params = {}) {
  const url = new URL(`https://v3.football.api-sports.io${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url, {
    headers: { 'x-apisports-key': API_FOOTBALL_KEY },
  });

  if (!response.ok) {
    throw new Error(`API Football error: ${response.status}`);
  }

  return response.json();
}

// ---------- GEMINI CLIENT ----------
async function llamarGemini(prompt, intentos = 1) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.GEMINI.MODELO}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: config.GEMINI.TEMPERATURA,
          maxOutputTokens: config.GEMINI.MAX_TOKENS,
        },
      }),
    });

    const data = await response.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    if (data.error?.code === 429 && intentos < config.GEMINI.INTENTOS_MAX) {
      const espera = Math.min(
        config.GEMINI.ESPERA_BASE * Math.pow(2, intentos - 1),
        config.GEMINI.ESPERA_MAX
      );
      console.log(`⚠️ Cuota de Gemini agotada. Esperando ${espera / 1000}s... (Intento ${intentos}/${config.GEMINI.INTENTOS_MAX})`);
      await esperar(espera);
      return llamarGemini(prompt, intentos + 1);
    }

    throw new Error(`Gemini error: ${JSON.stringify(data)}`);

  } catch (error) {
    if (intentos < config.GEMINI.INTENTOS_MAX) {
      console.log(`⚠️ Error en Gemini (${intentos}/${config.GEMINI.INTENTOS_MAX}). Reintentando...`);
      await esperar(config.GEMINI.ESPERA_BASE);
      return llamarGemini(prompt, intentos + 1);
    }
    throw error;
  }
}

// ---------- FUNCIONES PRINCIPALES ----------
async function resolverIdsLigas() {
  const ids = [];
  for (const objetivo of config.LIGAS_OBJETIVO) {
    try {
      const data = await llamarApiFootball('/leagues', { search: objetivo.busqueda });
      if (data.response?.length) {
        let elegido = data.response[0];
        if (objetivo.pais) {
          const match = data.response.find(r => r.country?.name === objetivo.pais);
          if (match) elegido = match;
        }
        ids.push(elegido.league.id);
        console.log(`✅ Liga: ${elegido.league.name} (ID: ${elegido.league.id})`);
      }
    } catch (error) {
      console.error(`❌ Error buscando liga ${objetivo.busqueda}:`, error.message);
    }
  }
  return ids;
}

async function traerPartidosDelDia() {
  const ligasIds = await resolverIdsLigas();
  const fechas = obtenerFechas(config.DIAS_BUSQUEDA);

  let todosLosPartidos = [];
  for (const fecha of fechas) {
    try {
      const data = await llamarApiFootball('/fixtures', { date: fecha, status: 'FT' });
      if (data.response?.length) {
        todosLosPartidos = todosLosPartidos.concat(data.response);
      }
    } catch (error) {
      console.error(`❌ Error obteniendo partidos del ${fecha}:`, error.message);
    }
  }

  if (!todosLosPartidos.length) {
    return [];
  }

  // Eliminar duplicados
  const vistos = new Set();
  const unicos = todosLosPartidos.filter(p => {
    if (vistos.has(p.fixture.id)) return false;
    vistos.add(p.fixture.id);
    return true;
  });

  // FILTRO: solo partidos de equipos prioritarios latinoamericanos
  const filtrados = unicos.filter(p => {
    const local = p.teams.home.name;
    const visitante = p.teams.away.name;
    return config.EQUIPOS_PRIORITARIOS.some(equipo =>
      local.toLowerCase().includes(equipo.toLowerCase()) ||
      visitante.toLowerCase().includes(equipo.toLowerCase())
    );
  });

  // Si no hay partidos de equipos prioritarios, usar partidos de Colombia y ligas objetivo
  let seleccionados = filtrados;
  if (seleccionados.length === 0) {
    console.log('⚠️ No hay partidos de equipos prioritarios. Usando partidos de Colombia y ligas objetivo.');
    const colombia = unicos.filter(p =>
      p.teams.home.name.toLowerCase().includes('colombia') ||
      p.teams.away.name.toLowerCase().includes('colombia')
    );
    const prioritarios = unicos.filter(p =>
      ligasIds.includes(p.league.id) && !colombia.includes(p)
    );
    seleccionados = [...colombia, ...prioritarios];
  }

  return seleccionados.slice(0, config.MAX_PIEZAS);
}

function construirJSON(partido) {
  return {
    partido_id: partido.fixture.id,
    local: partido.teams.home.name,
    visitante: partido.teams.away.name,
    resultado: `${partido.goals.home}-${partido.goals.away}`,
    fecha: new Date(partido.fixture.date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    estadio: partido.fixture.venue.name || 'Dato no disponible',
    liga: partido.league.name,
    ganador: partido.teams.home.winner
      ? partido.teams.home.name
      : partido.teams.away.winner
      ? partido.teams.away.name
      : 'Empate',
  };
}

async function generarContenido(json) {
  // PROMPT con enfoque latinoamericano
  const prompt = `Eres un periodista deportivo especializado en fútbol latinoamericano. Con estos datos:
${JSON.stringify(json, null, 2)}

Responde en este formato EXACTO (separado por "|"):
TITULAR: [frase impactante de máximo 8 palabras, con emoción]
RESUMEN: [resumen de máximo 20 palabras, destacando lo más importante]
GANCHO: [pregunta corta de máximo 10 palabras, que invite a opinar]

Ejemplos:
- TITULAR: América 3-1 Chivas | RESUMEN: El América domina el clásico y se acerca al título. | GANCHO: ¿Justo ganador?
- TITULAR: River 2-0 Boca | RESUMEN: River fue superior y se llevó el superclásico. | GANCHO: ¿Fue penal?

IMPORTANTE: Usa un tono apasionado y cercano, como habla el hincha latinoamericano.`;

  const respuesta = await llamarGemini(prompt);

  const titular = respuesta.match(/TITULAR:\s*([^|]*)/)?.[1]?.trim() || `${json.local} ${json.resultado} ${json.visitante}`;
  const resumen = respuesta.match(/RESUMEN:\s*([^|]*)/)?.[1]?.trim() || 'Partido disputado.';
  const gancho = respuesta.match(/GANCHO:\s*([^|]*)/)?.[1]?.trim() || '¿Qué opinas?';

  return { titular, resumen, gancho };
}

async function main() {
  console.log('🚀 Iniciando generación de contenido para fútbol latinoamericano...');

  try {
    const partidos = await traerPartidosDelDia();

    if (!partidos.length) {
      console.log('⚠️ No se encontraron partidos de equipos latinoamericanos.');
      return;
    }

    console.log(`✅ ${partidos.length} partidos seleccionados`);

    const resultados = [];
    const datosParaVideo = [];

    for (const partido of partidos) {
      console.log(`\n📊 Procesando: ${partido.teams.home.name} vs ${partido.teams.away.name}`);

      const json = construirJSON(partido);
      const contenido = await generarContenido(json);
      console.log(`   📝 Titular: "${contenido.titular}"`);
      console.log(`   📝 Resumen: "${contenido.resumen}"`);
      console.log(`   🎯 Gancho: "${contenido.gancho}"`);

      const [marcadorA, marcadorB] = json.resultado.split('-').map(Number);

      resultados.push({
        ...json,
        titular: contenido.titular,
        resumen: contenido.resumen,
        gancho: contenido.gancho,
      });

      datosParaVideo.push({
        competencia: json.liga.toUpperCase(),
        fecha: json.fecha,
        equipoA: json.local.toUpperCase(),
        equipoB: json.visitante.toUpperCase(),
        marcadorA,
        marcadorB,
        estadio: json.estadio,
        titular: contenido.titular,
        resumen: contenido.resumen,
        gancho: contenido.gancho,
      });
    }

    // Guardar resultados
    const dataDir = config.RUTAS.DATOS;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(dataDir, 'contenido-hoy.json'),
      JSON.stringify(resultados, null, 2)
    );

    fs.writeFileSync(
      path.join(dataDir, 'partido-video.json'),
      JSON.stringify(datosParaVideo[0] || {}, null, 2)
    );

    console.log(`\n✅ Archivos guardados en ${dataDir}/`);
    console.log(`   - contenido-hoy.json (${resultados.length} partidos)`);
    console.log(`   - partido-video.json (primer partido)`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generarContenido, construirJSON };
