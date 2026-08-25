// ============================================================
// src/predicciones/utils/calculos.js
// ============================================================
// Lógica de predicciones y cálculos estadísticos
// ============================================================

/**
 * Calcula la probabilidad de un evento usando promedio de goles
 * (Modelo simple de Poisson)
 */
function calcularProbabilidad(promedioLocal, promedioVisitante) {
  // Simplificación: si el local tiene mayor promedio, más probabilidad
  const total = promedioLocal + promedioVisitante;
  if (total === 0) return { local: 33, empate: 33, visitante: 33 };

  const probLocal = (promedioLocal / total) * 100;
  const probVisitante = (promedioVisitante / total) * 100;
  const probEmpate = 100 - probLocal - probVisitante;

  return {
    local: Math.round(probLocal),
    empate: Math.round(probEmpate),
    visitante: Math.round(probVisitante),
  };
}

/**
 * Calcula promedios de estadísticas clave (córners, goles, etc.)
 * a partir de los últimos N partidos
 */
function calcularPromedios(partidos, estadistica) {
  if (!partidos || partidos.length === 0) return 0;
  const total = partidos.reduce((sum, p) => {
    const valor = p.statistics?.find(s => s.type === estadistica)?.value;
    return sum + (parseFloat(valor) || 0);
  }, 0);
  return Math.round((total / partidos.length) * 10) / 10;
}

/**
 * Identifica la predicción estrella (el mercado con más valor)
 */
function identificarPrediccionEstrella(datos) {
  // Aquí puedes agregar tu lógica avanzada para detectar valor
  // Por ahora, usamos un ejemplo simple basado en córners
  const cornersTotal = datos.corners_local + datos.corners_visitante;
  const cuotaReferencia = 1.85; // Cuota de ejemplo para Over 9.5
  const probabilidadEstimada = cornersTotal / 10; // Simulación

  return {
    texto: `Over ${Math.round(cornersTotal)}.5 Córners`,
    cuota: `@${cuotaReferencia}`,
    valor: `${Math.round((probabilidadEstimada * cuotaReferencia - 1) * 100)}%`,
  };
}

/**
 * Calcula el valor detectado comparando tu probabilidad con la cuota
 */
function calcularValor(probabilidad, cuota) {
  const valor = (probabilidad / 100) * cuota - 1;
  return Math.round(valor * 100);
}

module.exports = {
  calcularProbabilidad,
  calcularPromedios,
  identificarPrediccionEstrella,
  calcularValor,
};
