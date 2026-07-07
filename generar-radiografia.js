const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Ligas prioritarias: Mundial, Liga BetPlay Colombia, Copa Libertadores, Copa Sudamericana
const LIGAS_PRIORITARIAS = [1, 239, 13, 11];

async function traerPartidoDeHoy() {
  const hoy = new Date().toISOString().split('T')[0];
  const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${hoy}&status=FT`, {
    headers: { 'x-apisports-key': API_FOOTBALL_KEY }
  });
  const data = await response.json();
  if (!data.response || data.response.length === 0) {
    throw new Error("No hay partidos terminados hoy todavia.");
  }

  const partidoColombia = data.response.find(p =>
    p.teams.home.name.toLowerCase().includes("colombia") ||
    p.teams.away.name.toLowerCase().includes("colombia")
  );
  if (partidoColombia) return partidoColombia;

  const partidoPrioritario = data.response.find(p => LIGAS_PRIORITARIAS.includes(p.league.id));
  if (partidoPrioritario) return partidoPrioritario;

  return data.response[0];
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

async function generarContenido(json) {
  const prompt = `Eres el generador de contenido de "Pronto Sport". Conviertes datos de un partido en un guion corto para video de TikTok, tono analítico y serio, sin humor.

REGLAS:
1. Solo usas los datos del JSON, nunca inventas cifras que no esten ahi.
2. 80-100 palabras en total.
3. Estructura: dato del resultado, contexto breve de por que importa, y un gancho de participacion especifico al final (pregunta o invitacion a opinar sobre una decision tactica o el resultado).

INPUT:
${JSON.stringify(json, null, 2)}

Responde SOLO con el guion, sin titulos ni explicaciones.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await response.json();
  if (!data.candidates) {
    console.log(JSON.stringify(data, null, 2));
    throw new Error("Gemini rechazo la peticion, ver log arriba");
  }
  return data.candidates[0].content.parts[0].text;
}

async function main() {
  const partido = await traerPartidoDeHoy();
  const json = construirJSON(partido);
  console.log("--- PARTIDO ---");
  console.log(JSON.stringify(json, null, 2));
  const guion = await generarContenido(json);
  console.log("--- GUION GENERADO ---");
  console.log(guion);
}

main();
