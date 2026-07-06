const API_KEY = process.env.API_FOOTBALL_KEY;

async function probarConexion() {
  const response = await fetch('https://v3.football.api-sports.io/status', {
    headers: {
      'x-apisports-key': API_KEY
    }
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

probarConexion();
