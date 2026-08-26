// ============================================================
// src/src/predicciones/index.js
// ============================================================
// Punto de entrada del módulo de predicciones
// ============================================================

const { generarImagen } = require('./utils/render.js');

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

module.exports = { generarTarjetas };
