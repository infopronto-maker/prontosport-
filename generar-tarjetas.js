// ============================================================
// generar-tarjetas.js - Script principal para generar tarjetas
// ============================================================
// Ejecuta: node generar-tarjetas.js
// ============================================================

require('dotenv').config();
const { generarTarjetas } = require('./src/predicciones/index.js');

async function main() {
  console.log('🚀 Iniciando generación de tarjetas de predicción...');
  await generarTarjetas();
  console.log('✅ Proceso completado.');
}

main().catch(console.error);
