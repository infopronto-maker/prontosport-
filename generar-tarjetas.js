// ============================================================
// generar-tarjetas.js - Script principal
// ============================================================

require('dotenv').config();
const path = require('path');

// Ruta absoluta al index.js del módulo
const moduloPath = path.join(__dirname, 'src', 'predicciones', 'index.js');
const { generarTarjetas } = require(moduloPath);

async function main() {
  console.log('🚀 Iniciando generación de tarjetas de predicción...');
  await generarTarjetas();
  console.log('✅ Proceso completado.');
}

main().catch(console.error);
