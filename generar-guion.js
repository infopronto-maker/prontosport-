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

async function generarGuion(partido) {
  const local = partido.teams.home.name;
  const visitante = partido.teams.away.name;
  const golesLocal = partido.goals.home;
  const golesVisitante = partido.goals.away;
  const liga = partido.league.name;

  const prompt = `Eres guionista de un canal de fútbol analítico y serio para TikTok.
Genera un guion corto (30-40 segundos al narrar, unas 80-100 palabras) sobre este partido:
${local} ${golesLocal} - ${golesVisitante} ${visitante} (${liga}).

Estructura obligatoria:
1. Un dato o hecho relevante del resultado (1-2 frases).
2. Contexto breve de por qué importa (1-2 frases).
3. Un gancho de participación analítico y específico al final (ej: pregunta táctica concreta, nunca genérica).

Tono: analítico, directo, sin humor ni memes. Responde SOLO con el guion, sin títulos ni explicaciones.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function main() {
  const partido = await traerPartidoDestacado();
  console.log("Partido elegido:", partido.teams.home.name, "vs", partido.teams.away.name);
  const guion = await generarGuion(partido);
  console.log("--- GUION GENERADO ---");
  console.log(guion);
}

main();
