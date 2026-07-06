const API_KEY = process.env.API_FOOTBALL_KEY;

async function traerPartidosDeHoy() {
  const hoy = new Date().toISOString().split('T')[0];

  const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${hoy}`, {
    headers: {
      'x-apisports-key': API_KEY
    }
  });

  const data = await response.json();
  console.log("Partidos encontrados:", data.results);
  console.log(JSON.stringify(data.response.slice(0, 3), null, 2));
}

traerPartidosDeHoy();

