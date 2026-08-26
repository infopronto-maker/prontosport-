// ============================================================
// generar-tarjetas.js - Script principal
// ============================================================
// Ejecuta: node generar-tarjetas.js
// ============================================================

const { generarTarjetas } = require('./src/src/predicciones/index.js');

// Datos de ejemplo
const partidosEjemplo = [
  {
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
  },
];

async function main() {
  console.log('🚀 Generando tarjetas de predicción...');
  await generarTarjetas(partidosEjemplo);
  console.log('✅ Proceso completado.');
}

main().catch(console.error);
