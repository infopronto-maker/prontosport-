// ============================================================
// src/predicciones/index.js
// ============================================================
// Orquestador del módulo de predicciones.
// ============================================================

const path = require('path');
const fs = require('fs');
const { 
  traerPartidosDeHoy, 
  obtenerPrediccion, 
  obtenerCuotas, 
  obtenerBajas 
} = require('./utils/api.js');
const { formatearDatosParaTarjeta } = require('./utils/calculos.js');
const { generarImagen } = require('./utils/render.js');

async function generarTarjetas() {
  console.log('🚀 Iniciando generación de tarjetas de predicción...');

  // 1. Obtener partidos del día
  const partidos = await traerPartidosDeHoy();
  if (!partidos || partidos.length === 0) {
    console.log('⚠️ No hay partidos hoy.');
    return;
  }

  console.log(`📊 ${partidos.length} partidos encontrados.`);

  // 2. Procesar cada partido
  for (let i = 0; i < partidos.length; i++) {
    const partido = partidos[i];
    const fixtureId = partido.fixture.id;

    console.log(`\n📹 Procesando partido ${i + 1}/${partidos.length}: ${partido.teams.home.name} vs ${partido.teams.away.name}`);

    try {
      // 2.1 Obtener datos de la API
      console.log('   🔍 Obteniendo predicción...');
      const prediccion = await obtenerPrediccion(fixtureId);
      
      console.log('   🔍 Obteniendo cuotas...');
      const cuotas = await obtenerCuotas(fixtureId);
      
      console.log('   🔍 Obteniendo bajas (local)...');
      const bajasLocal = await obtenerBajas(partido.teams.home.id, fixtureId);
      
      console.log('   🔍 Obteniendo bajas (visitante)...');
      const bajasVisitante = await obtenerBajas(partido.teams.away.id, fixtureId);
      
      // Combinar bajas (mejor esfuerzo)
      const bajas = { 
        response: [ ...(bajasLocal || []), ...(bajasVisitante || []) ] 
      };

      // 2.2 Formatear datos para la tarjeta
      console.log('   📝 Formateando datos...');
      const datosTarjeta = formatearDatosParaTarjeta(prediccion, cuotas, bajas, partido);

      // 2.3 Generar imagen
      console.log('   🖼️ Generando imagen...');
      const nombreArchivo = `tarjeta-${fixtureId}-${Date.now()}.png`;
      await generarImagen(datosTarjeta, nombreArchivo);

      console.log(`   ✅ Tarjeta generada: ${nombreArchivo}`);

    } catch (error) {
      console.error(`   ❌ Error procesando partido ${fixtureId}:`, error.message);
    }

    // Pequeña pausa entre partidos para no saturar la API
    await sleep(1000);
  }

  console.log('\n✅ Proceso completado.');
}

// Función sleep para esperar entre peticiones
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  generarTarjetas().catch(console.error);
}

module.exports = { generarTarjetas };
