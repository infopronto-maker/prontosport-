const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function traerPartidoDestacado() {
  const hoy = new Date().toISOString().split('T')[0];
  const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${hoy}`, {
    headers: { 'x-apisports-key': API_FOOTBALL_KEY }
  });
  const data = await response.json();
  const partido = data.response.find(p => p.fixture.status.short === 'FT') || data.response[0];
  return partido;
}

async function traerEstadisticas(fixtureId) {
  const response = await fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`, {
    headers: { 'x-apisports-key': API_FOOTBALL_KEY }
  });
  const data = await response.json();
  return data.response;
}

function buscarStat(statsEquipo, nombreStat) {
  if (!statsEquipo) return "Dato no disponible";
  const item = statsEquipo.statistics.find(s => s.type === nombreStat);
  return item && item.value !== null ? item.value : "Dato no disponible";
}

async function construirJSON(partido) {
  const stats = await traerEstadisticas(partido.fixture.id);
  const statsLocal = stats[0];
  const statsVisitante = stats[1];

  return {
    partido_id: partido.fixture.id,
    local: partido.teams.home.name,
    visitante: partido.teams.away.name,
    resultado: `${partido.goals.home}-${partido.goals.away}`,
    fecha: new Date(partido.fixture.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
    estadio: partido.fixture.venue.name || "Dato no disponible",
    datos: {
      posesion_local: buscarStat(statsLocal, "Ball Possession"),
      posesion_visitante: buscarStat(statsVisitante, "Ball Possession"),
      tiros_local: buscarStat(statsLocal, "Total Shots"),
      tiros_visitante: buscarStat(statsVisitante, "Total Shots"),
      tiros_arco_local: buscarStat(statsLocal, "Shots on Goal"),
      tiros_arco_visitante: buscarStat(statsVisitante, "Shots on Goal"),
      corners_local: buscarStat(statsLocal, "Corner Kicks"),
      corners_visitante: buscarStat(statsVisitante, "Corner Kicks"),
      faltas_local: buscarStat(statsLocal, "Fouls"),
      faltas_visitante: buscarStat(statsVisitante, "Fouls"),
      amarillas_local: buscarStat(statsLocal, "Yellow Cards"),
      amarillas_visitante: buscarStat(statsVisitante, "Yellow Cards"),
      xg_local: "Dato no disponible",
      xg_visitante: "Dato no disponible",
      heat_local: "Dato no disponible",
      heat_visitante: "Dato no disponible",
      ppda_local: "Dato no disponible",
      ppda_visitante: "Dato no disponible",
      red_pases_clave: "Dato no disponible",
      dato_record: "Dato no disponible"
    }
  };
}

async function generarRadiografia(json) {
  const prompt = `Eres el generador de "Pronto Sport Data Feed". Tu única función es convertir datos JSON de un partido en 9 piezas de contenido estandarizadas, sin opinión, listas para uso B2B.

REGLAS INVIOLABLES:
1. CERO INVENTO. Solo usas el JSON que te doy.
2. CERO OPINIÓN. Solo describes el dato.
3. Si un dato viene como "Dato no disponible", escribe exactamente eso y continúa. Nunca inventes un valor.
4. FORMATO ATÓMICO. Cada pieza es independiente, mismo orden siempre.
5. SALIDA: Lista numerada del 1 al 9. Cada ítem es el guion de 1 pieza.

INPUT:
${JSON.stringify(json, null, 2)}

SALIDA OBLIGATORIA - 9 PIEZAS:
1. TITLE CARD: Partido. [local] [resultado] [visitante]. Fecha [fecha]. Estadio [estadio]. Pronto Sport Data.
2. POSESIÓN: Posesión. [local] [posesion_local]. [visitante] [posesion_visitante].
3. TIROS: Remates. [local] [tiros_local] ([tiros_arco_local] al arco). [visitante] [tiros_visitante] ([tiros_arco_visitante] al arco).
4. CORNERS: Tiros de esquina. [local] [corners_local]. [visitante] [corners_visitante].
5. FALTAS: Faltas cometidas. [local] [faltas_local]. [visitante] [faltas_visitante].
6. TARJETAS: Tarjetas amarillas. [local] [amarillas_local]. [visitante] [amarillas_visitante].
7. XG_HEATMAP_PPDA: Analítica avanzada (xG, mapa de calor, PPDA). Dato no disponible en esta edición.
8. OUTRO_BRAND: Data por Pronto Sport. Feed completo disponible bajo licencia.
9. RADIOGRAFÍA_60S: Junta las líneas 1 a 6 en un solo párrafo, separadas por punto, ignorando la línea 7.

Nunca pares, nunca expliques.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await response.json();
  console.log("--- RESPUESTA CRUDA DE GEMINI ---");
  console.log(JSON.stringify(data, null, 2));
  if (!data.candidates) {
    throw new Error("Gemini rechazo la peticion, ver log arriba");
  }
  return data.candidates[0].content.parts[0].text;
}

async function main() {
  const partido = await traerPartidoDestacado();
  console.log("Partido elegido:", partido.teams.home.name, "vs", partido.teams.away.name);
  const json = await construirJSON(partido);
  console.log("--- JSON CONSTRUIDO ---");
  console.log(JSON.stringify(json, null, 2));
  const radiografia = await generarRadiografia(json);
  console.log("--- RADIOGRAFÍA GENERADA ---");
  console.log(radiografia);
}

main();

