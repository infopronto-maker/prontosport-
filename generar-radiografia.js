// ============================================================
// generar-radiografia.js - Añade estadísticas a los datos (VERSIÓN MEJORADA)
// ============================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require('./config.js');

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;

// ---------- UTILIDADES ----------
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

// ---------- FUNCIONES PRINCIPALES ----------
async function traerEstadisticas(fixtureId) {
  try {
    const data = await llamarApiFootball('/fixtures/statistics', { fixture: fixtureId });

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
      // Posesión
      posesionA: buscarStat(statsLocal, 'Ball Possession') ?? 0,
      posesionB: buscarStat(statsVisitante, 'Ball Possession') ?? 0,
      // Remates
      rematesA: buscarStat(statsLocal, 'Total Shots') ?? 0,
      rematesB: buscarStat(statsVisitante, 'Total Shots') ?? 0,
      aPuertaA: buscarStat(statsLocal, 'Shots on Goal') ?? 0,
      aPuertaB: buscarStat(statsVisitante, 'Shots on Goal') ?? 0,
      // Córners
      cornersA: buscarStat(statsLocal, 'Corner Kicks') ?? 0,
      cornersB: buscarStat(statsVisitante, 'Corner Kicks') ?? 0,
      // Faltas
      faltasA: buscarStat(statsLocal, 'Fouls') ?? 0,
      faltasB: buscarStat(statsVisitante, 'Fouls') ?? 0,
      // Tarjetas
      amarillasA: buscarStat(statsLocal, 'Yellow Cards') ?? 0,
      amarillasB: buscarStat(statsVisitante, 'Yellow Cards') ?? 0,
      rojasA: buscarStat(statsLocal, 'Red Cards') ?? 0,
      rojasB: buscarStat(statsVisitante, 'Red Cards') ?? 0,
    };
  } catch (error) {
    console.error(`❌ Error obteniendo estadísticas para fixture ${fixtureId}:`, error.message);
    return null;
  }
}

async function actualizarDatosConEstadisticas() {
  console.log('📊 Actualizando datos con estadísticas...');

  try {
    // Leer datos existentes
    const dataDir = config.RUTAS.DATOS;
    const contenidoPath = path.join(dataDir, 'contenido-hoy.json');
    const videoPath = path.join(dataDir, 'partido-video.json');

    if (!fs.existsSync(contenidoPath) || !fs.existsSync(videoPath)) {
      console.log('⚠️ No hay datos previos. Ejecuta primero generar-guion.js');
      return;
    }

    const contenido = JSON.parse(fs.readFileSync(contenidoPath, 'utf8'));
    const videoData = JSON.parse(fs.readFileSync(videoPath, 'utf8'));

    // Procesar cada partido
    const contenidoActualizado = [];
    let videoActualizado = null;

    for (const partido of contenido) {
      console.log(`📊 Procesando estadísticas: ${partido.local} vs ${partido.visitante}`);
      const stats = await traerEstadisticas(partido.partido_id);

      if (stats) {
        // Actualizar contenido
        contenidoActualizado.push({
          ...partido,
          stats,
        });

        // Actualizar datos de video (solo el primero)
        if (!videoActualizado) {
          const [marcadorA, marcadorB] = partido.resultado.split('-').map(Number);
          videoActualizado = {
            competencia: partido.liga.toUpperCase(),
            fecha: partido.fecha,
            equipoA: partido.local.toUpperCase(),
            equipoB: partido.visitante.toUpperCase(),
            marcadorA,
            marcadorB,
            estadio: partido.estadio,
            ganchoFinal: partido.ganchoFinal || '¿Qué opinas de este resultado?',
            guion: partido.guion || '',
            // Estadísticas
            posesionA: stats.posesionA,
            posesionB: stats.posesionB,
            rematesA: stats.rematesA,
            rematesB: stats.rematesB,
            aPuertaA: stats.aPuertaA,
            aPuertaB: stats.aPuertaB,
            cornersA: stats.cornersA,
            cornersB: stats.cornersB,
            faltasA: stats.faltasA,
            faltasB: stats.faltasB,
            amarillasA: stats.amarillasA,
            amarillasB: stats.amarillasB,
            rojasA: stats.rojasA,
            rojasB: stats.rojasB,
          };
        }

        console.log(`   ✅ Estadísticas añadidas`);
        await esperar(500); // Pequeña pausa para no saturar la API
      } else {
        console.log(`   ⚠️ No se obtuvieron estadísticas`);
        contenidoActualizado.push(partido);
      }
    }

    // Guardar resultados actualizados
    fs.writeFileSync(contenidoPath, JSON.stringify(contenidoActualizado, null, 2));

    if (videoActualizado) {
      fs.writeFileSync(videoPath, JSON.stringify(videoActualizado, null, 2));
    }

    console.log(`\n✅ Estadísticas guardadas en ${dataDir}/`);

  } catch (error) {
    console.error('❌ Error actualizando estadísticas:', error);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  actualizarDatosConEstadisticas();
}

module.exports = { traerEstadisticas, actualizarDatosConEstadisticas };
