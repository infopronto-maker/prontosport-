// ============================================================
// src/src/predicciones/index.js
// ============================================================
// Punto de entrada del módulo de predicciones
// ============================================================

const path = require('path');
const fs = require('fs');
const { obtenerPartidosDelDia } = require('./utils/api.js');
const { generarImagen } = require('./utils/render.js');

// Datos de ejemplo para probar (después conectaremos con API real)
const partidoEjemplo = {
  local: 'Nacional',
  visitante: 'Millonarios',
  fecha: 'Sábado 28 de agosto',
  hora: '8:00 PM',
  liga: 'Copa BetPlay',
  prediccion: 'Over 9.5 Córners',
  cuota: '@1.85',
  valor: '+15%',
  prob_local: 52,
  prob_empate: 28,
  prob_visitante: 20,
  corners_local: 5.2,
  corners_visitante: 4.8,
  goles_local: 1.8,
  goles_visitante: 1.2,
};

async function generarTarjetas(partidos) {
  console.log(`📊 Generando tarjetas para ${partidos.length} partidos...`);

  for (let i = 0; i < partidos.length; i++) {
    const partido = partidos[i];
    console.log(`🖼️ Procesando: ${partido.local} vs ${partido.visitante}`);

    const nombreArchivo = `tarjeta-${i + 1}-${Date.now()}.png`;
    await generarImagen(partido, nombreArchivo);
  }

  console.log(`✅ ${partidos.length} tarjetas generadas.`);
}

async function main() {
  console.log('🚀 Iniciando generación de tarjetas de predicción...');

  // Por ahora usamos datos de ejemplo
  // Más tarde, reemplazar con: const partidos = await obtenerPartidosDelDia();
  const partidos = [partidoEjemplo]; // Array con un partido de ejemplo

  if (!partidos || partidos.length === 0) {
    console.log('⚠️ No hay partidos para generar tarjetas.');
    return;
  }

  await generarTarjetas(partidos);
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generarTarjetas };
