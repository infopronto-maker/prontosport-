const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const fs = require('fs');

const MAX_PIEZAS = 5;

const LIGAS_OBJETIVO = [
  { busqueda: 'World Cup', pais: null },
  { busqueda: 'Primera A', pais: 'Colombia' },
  { busqueda: 'Libertadores', pais: null },
  { busqueda: 'Sudamericana', pais: null },
];

async function resolverIdsLigas() {
  const ids = [];
  for (const objetivo of LIGAS_OBJETIVO) {
    const params = new URLSearchParams({ search: objetivo.busqueda });

    const response = await fetch(`https://v3.football.api-sports.io/leagues?${params.toString()}`, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });
    const data = await response.json();

    if (data.response && data.response.length > 0) {
      let elegido = data.response[0];
      if (objetivo.pais) {
        const match = data.response.find(r => r.country?.name === objetivo.pais);
        if (match) elegido = match;
      }
      const liga = elegido.league;
      console.log(`Liga encontrada: "${objetivo.busqueda}" -> ID ${liga.id} (${liga.name}, ${elegido.country?.name})`);
      ids.push(liga.id);
    } else {
      console.log(`No se encontro liga para: "${objetivo.busqueda}" — RESPUESTA CRUDA DE LA API:`);
      console.log(JSON.stringify(data, null, 2));
    }
  }
  return ids;
}

async function traerPartidosDelDia() {
  const ligasIds = await resolverIdsLigas();

  const fechas = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    fechas.push(d.toISOString().split('T')[0]);
  }

  let todosLosPartidos = [];
  for (const fecha of fechas) {
    const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${fecha}&status=FT`, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY }
    });
    const data = await response.json();
    if (data.response && data.response.length > 0) {
      todosLosPartidos = todosLosPartidos.concat(data.response);
    }
  }

  if (todosLosPartidos.length === 0) {
    console.log("No hay partidos terminados en los ultimos 3 dias.");
    return [];
  }

  const vistos = new Set();
  todosLosPartidos = todosLosPartidos.filter(p => {
    if (vistos.has(p.fixture.id)) return false;
    vistos.add(p.fixture.id);
    return true;
  });

  const partidosColombia = todosLosPartidos.filter(p =>
    p.teams.home.name.toLowerCase().includes("colombia") ||
    p.teams.away.name.toLowerCase().includes("colombia")
  );

  const partidosPrioritarios = todosLosPartidos.filter(p =>
    ligasIds.includes(p.league.id) &&
    !partidosColombia.includes(p)
  );

  const seleccionados = [...partidosColombia, ...partidosPrioritarios].slice(0, MAX_PIEZAS);
  return seleccionados;
}

async function traerEstadisticas(fixtureId) {
  const response = await fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`, {
    headers: { 'x-apisports-key': API_FOOTBALL_KEY }
  });
  const data = await response.json();

  if (!data.response || data.response.length < 2) {
    return null;
  }

  const buscarStat = (statsEquipo, nombre) => {
    const item = statsEquipo.find(s => s.type === nombre);
    if (!item || item.value === null || item.value === undefined) return null;
    if (typeof item.value === 'string' && item.value.includes('%')) {
      return parseInt(item.value.replace('%', ''), 10);
    }
    return item.value;
  };

  const statsLocal = data.response[0].statistics;
  const statsVisitante = data.response[1].statistics;

  return {
    posesionA: buscarStat(statsLocal, 'Ball Possession'),
    posesionB: buscarStat(statsVisitante, 'Ball Possession'),
    rematesA: buscarStat(statsLocal, 'Total Shots'),
    rematesB: buscarStat(statsVisitante, 'Total Shots'),
    aPuertaA: buscarStat(statsLocal, 'Shots on Goal'),
    aPuertaB: buscarStat(statsVisitante, 'Shots on Goal'),
    cornersA: buscarStat(statsLocal, 'Corner Kicks'),
    cornersB: buscarStat(statsVisitante, 'Corner Kicks'),
  };
}

function construirJSON(partido) {
  return {
    partido_id: partido.fixture.id,
    local: partido.teams.home.name,
    visitante: partido.teams.away.name,
    resultado: `${partido.goals.home}-${partido.goals.away}`,
    fecha: new Date(partido.fixture.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
    estadio: partido.fixture.venue.name || "Dato no disponible",
    liga: partido.league.name,
    ganador: partido.teams.home.winner ? partido.teams.home.name : (partido.teams.away.winner ? partido.teams.away.name : "Empate")
  };
}

// --- NUEVO: espera simple ---
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- NUEVO: llamada a Gemini con reintento automatico ante error 429 (cuota) ---
async function llamarGemini(prompt, intentosMax = 4) {
  for (let intento = 1; intento <= intentosMax; intento++) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();

    if (data.candidates) {
      return data.candidates[0].content.parts[0].text;
    }

    const esCuota = data.error?.code === 429 || /quota|429|RESOURCE_EXHAUSTED/i.test(JSON.stringify(data.error || {}));

    if (!esCuota || intento === intentosMax) {
      console.log("Gemini no devolvio candidates. Respuesta completa:");
      console.log(JSON.stringify(data, null, 2));
      throw new Error("Gemini rechazo la peticion, ver log arriba");
    }

    // Buscar el retryDelay real que manda Google (ej. "51s")
    let esperaMs = 60000; // default 60s si no viene el dato
    const detalle = data.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
    if (detalle?.retryDelay) {
      const segundos = parseInt(detalle.retryDelay.replace('s', ''), 10);
      if (!isNaN(segundos)) esperaMs = (segundos + 3) * 1000; // +3s de margen
    }

    console.log(`Gemini: limite de cuota alcanzado (intento ${intento}/${intentosMax}). Esperando ${Math.round(esperaMs / 1000)}s antes de reintentar...`);
    await esperar(esperaMs);
  }
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
    const texto = await llamarGemini(prompt);
    return texto.trim();
  } catch (e) {
    console.log("No se pudo generar gancho final, se usa uno por defecto:", e.message);
    return "¿Qué opinas de este resultado?";
  }
}

function construirDatosVideo(json, stats, ganchoFinal) {
  const [marcadorA, marcadorB] = json.resultado.split('-').map(Number);
  return {
    competencia: json.liga.toUpperCase(),
    fecha: json.fecha,
    equipoA: json.local.toUpperCase(),
    equipoB: json.visitante.toUpperCase(),
    posesionA: stats?.posesionA ?? 0,
    posesionB: stats?.posesionB ?? 0,
    rematesA: stats?.rematesA ?? 0,
    rematesB: stats?.rematesB ?? 0,
    aPuertaA: stats?.aPuertaA ?? 0,
    aPuertaB: stats?.aPuertaB ?? 0,
    cornersA: stats?.cornersA ?? 0,
    cornersB: stats?.cornersB ?? 0,
    marcadorA: marcadorA,
    marcadorB: marcadorB,
    estadio: json.estadio,
    ganchoFinal: ganchoFinal,
  };
}

async function main() {
  const partidos = await traerPartidosDelDia();

  if (partidos.length === 0) {
    console.log("No se genero contenido: sin partidos prioritarios terminados en los ultimos 3 dias.");
    return;
  }

  console.log(`--- ${partidos.length} PARTIDO(S) SELECCIONADO(S) ---`);

  const resultados = [];
  let datosParaVideo = null;

  for (const partido of partidos) {
    const json = construirJSON(partido);
    console.log("\n=== PARTIDO ===");
    console.log(JSON.stringify(json, null, 2));

    const guion = await generarContenido(json);
    console.log("--- GUION GENERADO ---");
    console.log(guion);

    const stats = await traerEstadisticas(json.partido_id);
    const ganchoFinal = await generarGanchoFinal(json);

    resultados.push({ ...json, guion, stats, ganchoFinal });

    if (!datosParaVideo) {
      datosParaVideo = construirDatosVideo(json, stats, ganchoFinal);
    }
  }

  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/contenido-hoy.json', JSON.stringify(resultados, null, 2));
  fs.writeFileSync('data/partido-video.json', JSON.stringify(datosParaVideo, null, 2));

  console.log("\nArchivos guardados: data/contenido-hoy.json y data/partido-video.json");
}

main().catch(error => {
  console.error("Error fatal:", error);
  process.exitCode = 1;
});

