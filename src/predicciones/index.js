// ============================================================
// src/predicciones/index.js
// ============================================================
// Orquestador del módulo de predicciones.
// ============================================================

const path = require('path');

// Todas las rutas usando __dirname
const api = require(path.join(__dirname, 'utils', 'api.js'));
const calculos = require(path.join(__dirname, 'utils', 'calculos.js'));
const render = require(path.join(__dirname, 'utils', 'render.js'));

const { traerPartidosDeHoy, obtenerPrediccion, obtenerCuotas, obtenerBajas } = api;
const { formatearDatosParaTarjeta } = calculos;
const { generarImagen } = render;

async function generarTarjetas() {
  console.log('🚀 Iniciando generación de tarjetas de predicción...');

  const partidos = await traerPartidosDeHoy();
  if (!partidos || partidos.length === 0) {
    console.log('⚠️ No hay partidos hoy.');
    return;
  }

  console.log(`📊 ${partidos.length} partidos encontrados.`);

  for (let i = 0; i < partidos.length; i++) {
    const partido = partidos[i];
    const fixtureId = partido.fixture.id;

    console.log(`\n📹 Procesando partido ${i + 1}/${partidos.length}: ${partido.teams.home.name} vs ${partido.teams.away.name}`);

    try {
      console.log('   🔍 Obteniendo predicción...');
      const prediccion = await obtenerPrediccion(fixtureId);
      
      console.log('   🔍 Obteniendo cuotas...');
      const cuotas = await obtenerCuotas(fixtureId);
      
      console.log('   🔍 Obteniendo bajas (local)...');
      const bajasLocal = await obtenerBajas(partido.teams.home.id, fixtureId);
      
      console.log('   🔍 Obteniendo bajas (visitante)...');
      const bajasVisitante = await obtenerBajas(partido.teams.away.id, fixtureId);
      
      const bajas = { 
        response: [ ...(bajasLocal || []), ...(bajasVisitante || []) ] 
      };

      console.log('   📝 Formateando datos...');
      const datosTarjeta = formatearDatosParaTarjeta(prediccion, cuotas, bajas, partido);

      console.log('   🖼️ Generando imagen...');
      const nombreArchivo = `tarjeta-${fixtureId}-${Date.now()}.png`;
      await generarImagen(datosTarjeta, nombreArchivo);

      console.log(`   ✅ Tarjeta generada: ${nombreArchivo}`);

    } catch (error) {
      console.error(`   ❌ Error procesando partido ${fixtureId}:`, error.message);
    }

    await sleep(1000);
  }

  console.log('\n✅ Proceso completado.');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

if (require.main === module) {
  generarTarjetas().catch(console.error);
}

module.exports = { generarTarjetas };
