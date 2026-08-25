// ============================================================
// src/predicciones/utils/api.js
// ============================================================
// Conexión con API-Football
// ============================================================

const axios = require('axios');
const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

// Ligas LATAM que nos interesan
const LIGAS_LATAM = [
  { id: 128, nombre: 'Primera A' },      // Colombia
  { id: 128, nombre: 'Primera A' },      // Argentina (cambiar por ID real)
  { id: 71, nombre: 'Serie A' },         // Brasil
  { id: 262, nombre: 'Liga MX' },        // México
  { id: 262, nombre: 'Primera División' },// Chile
  { id: 13, nombre: 'Copa Libertadores' },
  { id: 14, nombre: 'Copa Sudamericana' },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function llamarApiFootball(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await axios.get(url.href, {
    headers: { 'x-apisports-key': API_KEY }
  });
  return res.data;
}

async function obtenerPartidosDelDia() {
  const hoy = new Date().toISOString().split('T')[0];
  const todos = [];

  for (const liga of LIGAS_LATAM) {
    try {
      const data = await llamarApiFootball('/fixtures', {
        date: hoy,
        league: liga.id,
      });
      if (data.response) {
        todos.push(...data.response);
      }
      await sleep(300); // Evitar saturar la API
    } catch (e) {
      console.error(`Error en liga ${liga.nombre}:`, e.message);
    }
  }
  return todos;
}

async function obtenerEstadisticas(fixtureId) {
  try {
    const data = await llamarApiFootball('/fixtures/statistics', {
      fixture: fixtureId,
    });
    return data.response || [];
  } catch (e) {
    console.error(`Error obteniendo estadísticas del partido ${fixtureId}:`, e.message);
    return [];
  }
}

async function obtenerLogoEquipo(equipoId) {
  try {
    const data = await llamarApiFootball('/teams', { id: equipoId });
    if (data.response && data.response.length > 0) {
      return data.response[0].team.logo;
    }
    return null;
  } catch (e) {
    console.error(`Error obteniendo logo del equipo ${equipoId}:`, e.message);
    return null;
  }
}

module.exports = {
  LIGAS_LATAM,
  sleep,
  llamarApiFootball,
  obtenerPartidosDelDia,
  obtenerEstadisticas,
  obtenerLogoEquipo,
};
