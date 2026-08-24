// ============================================================
// generar-guion.js - Genera contenido con Gemini (VERSIÓN MEJORADA)
// ============================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require('./config.js');

// ---------- CONFIGURACIÓN ----------
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

// ---------- GEMINI CLIENT (CON RETRY INTELIGENTE) ----------
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

    // Si es error de cuota (429) y no hemos agotado intentos
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

  // Priorizar partidos de Colombia
  const colombia = unicos.filter(p =>
    p.teams.home.name.toLowerCase().includes('colombia') ||
    p.teams.away.name.toLowerCase().includes('colombia')
  );

  // Priorizar ligas objetivo
  const prioritarios = unicos.filter(p =>
    ligasIds.includes(p.league.id) && !colombia.includes(p)
  );

  return [...colombia, ...prioritarios].slice(0, config.MAX_PIEZAS);
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
  const prompt = `Eres el generador de contenido de "Pronto Sport". Conviertes datos de un partido en un guion corto para video de TikTok, tono analítico y serio, sin humor.

REGLAS:
1. Solo usas los datos del JSON, nunca inventas cifras que no esten ahi.
2. 80-100 palabras en total.
3. Estructura: dato del resultado, contexto breve de por que importa, y un gancho de participacion especifico al final (pregunta o invitacion a opinar sobre una decision tactica o el resultado).

INPUT:
${JSON.stringify(json, null, 2)}

Responde SOLO con el guion, sin titulos ni explicaciones.`;

  return await llamarGemini(prompt);
}

async function generarGanchoFinal(json) {
  const prompt = `Basado en este partido, escribe UNA sola pregunta táctica corta (máximo 12 palabras) para invitar a la gente a comentar en un video de TikTok. Tono analítico, no humor. Solo la pregunta, nada más.

INPUT:
${JSON.stringify(json, null, 2)}`;

  try {
    return await llamarGemini(prompt);
  } catch (error) {
    console.warn('⚠️ No se pudo generar gancho, usando predeterminado');
    return '¿Qué opinas de este resultado?';
  }
}

async function main() {
  console.log('🚀 Iniciando generación de contenido...');

  try {
    const partidos = await traerPartidosDelDia();

    if (!partidos.length) {
      console.log('⚠️ No se encontraron partidos en los últimos 3 días.');
      return;
    }

    console.log(`✅ ${partidos.length} partidos seleccionados`);

    const resultados = [];
    const datosParaVideo = [];

    for (const partido of partidos) {
      console.log(`\n📊 Procesando: ${partido.teams.home.name} vs ${partido.teams.away.name}`);

      const json = construirJSON(partido);
      const guion = await generarContenido(json);
      console.log(`   📝 Guion generado (${guion.length} caracteres)`);

      const ganchoFinal = await generarGanchoFinal(json);
      console.log(`   🎯 Gancho: "${ganchoFinal}"`);

      const [marcadorA, marcadorB] = json.resultado.split('-').map(Number);

      resultados.push({
        ...json,
        guion,
        ganchoFinal,
      });

      datosParaVideo.push({
        competencia: json.liga.toUpperCase(),
        fecha: json.fecha,
        equipoA: json.local.toUpperCase(),
        equipoB: json.visitante.toUpperCase(),
        marcadorA,
        marcadorB,
        estadio: json.estadio,
        ganchoFinal,
        guion,
        // Estadísticas se añadirán después (en generar-radiografia.js)
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

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { generarContenido, generarGanchoFinal, construirJSON };
