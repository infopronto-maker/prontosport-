// ============================================================
// src/predicciones/utils/calculos.js
// ============================================================
// Formatea los datos de la API para la tarjeta gráfica.
// NO inventa números — solo procesa lo que viene de API-Football.
// ============================================================

/**
 * Procesa los datos de predicción y cuotas para la tarjeta
 * @param {Object} prediccion - Resultado de obtenerPrediccion(fixtureId)
 * @param {Object} cuotas - Resultado de obtenerCuotas(fixtureId)
 * @param {Object} bajas - Resultado de obtenerBajas(equipoId, fixtureId)
 * @param {Object} partido - Datos básicos del partido (equipos, fecha, etc.)
 * @returns {Object} Datos formateados para render.js
 */
function formatearDatosParaTarjeta(prediccion, cuotas, bajas, partido) {
  // Extraer datos de predicción (API-Football ya los calcula)
  const probLocal = prediccion?.predictions?.[0]?.probabilities?.home || 0;
  const probEmpate = prediccion?.predictions?.[0]?.probabilities?.draw || 0;
  const probVisitante = prediccion?.predictions?.[0]?.probabilities?.away || 0;
  
  // Sugerencia de la API (quién tiene más probabilidad)
  const sugerencia = prediccion?.predictions?.[0]?.suggestion || 'Empate';
  
  // Racha reciente (ej: "GGEPG" → puntos de colores)
  const formaLocal = partido?.teams?.home?.form || '-----';
  const formaVisitante = partido?.teams?.away?.form || '-----';
  
  // Promedios de goles (vienen en la predicción)
  const golesLocal = prediccion?.predictions?.[0]?.goals?.home || 0;
  const golesVisitante = prediccion?.predictions?.[0]?.goals?.away || 0;
  
  // Promedios de córners (no vienen en /predictions, se calculan si es posible)
  // Por ahora usamos valores por defecto o los dejamos en 0
  const cornersLocal = partido?.statistics?.home?.corners || 0;
  const cornersVisitante = partido?.statistics?.away?.corners || 0;
  
  // Cuota de referencia (de obtenerCuotas)
  let cuotaLocal = 0;
  let cuotaEmpate = 0;
  let cuotaVisitante = 0;
  if (cuotas && cuotas.response && cuotas.response.length > 0) {
    const bookmaker = cuotas.response[0]; // Tomamos el primero disponible
    const odds = bookmaker.bookmaker?.[0]?.odds || [];
    odds.forEach((odd) => {
      if (odd.name === 'Home') cuotaLocal = odd.value;
      if (odd.name === 'Draw') cuotaEmpate = odd.value;
      if (odd.name === 'Away') cuotaVisitante = odd.value;
    });
  }
  
  // Determinar la "predicción estrella" (el mercado con más valor)
  // Criterio: probabilidad > 50% y cuota > 1.50 (para que tenga valor)
  let prediccionEstrella = 'Sin predicción destacada';
  let cuotaEstrella = 0;
  let valorEstrella = 0;
  
  // Usamos la sugerencia de la API como base
  if (sugerencia === 'Home' && probLocal > 50 && cuotaLocal > 1.50) {
    prediccionEstrella = `Victoria de ${partido.teams.home.name}`;
    cuotaEstrella = cuotaLocal;
    valorEstrella = Math.round((probLocal / 100) * cuotaLocal - 1);
  } else if (sugerencia === 'Away' && probVisitante > 50 && cuotaVisitante > 1.50) {
    prediccionEstrella = `Victoria de ${partido.teams.away.name}`;
    cuotaEstrella = cuotaVisitante;
    valorEstrella = Math.round((probVisitante / 100) * cuotaVisitante - 1);
  } else if (sugerencia === 'Draw' && probEmpate > 35) {
    prediccionEstrella = 'Empate';
    cuotaEstrella = cuotaEmpate;
    valorEstrella = Math.round((probEmpate / 100) * cuotaEmpate - 1);
  }
  
  // Si no se cumple ningún umbral, usamos Over/Under goles (si está disponible)
  // Nota: esto es opcional y requiere datos adicionales de la API
  
  // Formatear bajas (mejor esfuerzo)
  const bajasLocal = bajas?.response?.filter(b => b.team.id === partido.teams.home.id) || [];
  const bajasVisitante = bajas?.response?.filter(b => b.team.id === partido.teams.away.id) || [];
  
  const textoBajasLocal = bajasLocal.map(b => `${b.player.name} (${b.type})`).join(', ');
  const textoBajasVisitante = bajasVisitante.map(b => `${b.player.name} (${b.type})`).join(', ');
  
  // Retornar objeto limpio para render.js
  return {
    // Datos básicos
    local: partido.teams.home.name,
    visitante: partido.teams.away.name,
    fecha: new Date(partido.fixture.date).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'long', year: 'numeric'
    }),
    hora: new Date(partido.fixture.date).toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit'
    }),
    liga: partido.league.name,
    
    // Predicción estrella (calculada)
    prediccion: prediccionEstrella,
    cuota: cuotaEstrella ? `@${cuotaEstrella.toFixed(2)}` : 'N/A',
    valor: valorEstrella ? `${valorEstrella}%` : 'N/A',
    
    // Probabilidades 1X2 (de la API)
    prob_local: probLocal,
    prob_empate: probEmpate,
    prob_visitante: probVisitante,
    
    // Promedios (de la API o calculados)
    corners_local: cornersLocal,
    corners_visitante: cornersVisitante,
    goles_local: golesLocal,
    goles_visitante: golesVisitante,
    
    // Racha reciente (formateada)
    racha_local: formaLocal.split('').map(r => r === 'G' ? 'G' : r === 'E' ? 'E' : 'P'),
    racha_visitante: formaVisitante.split('').map(r => r === 'G' ? 'G' : r === 'E' ? 'E' : 'P'),
    
    // Bajas (texto plano)
    bajas_local: textoBajasLocal || 'Ninguna',
    bajas_visitante: textoBajasVisitante || 'Ninguna',
    
    // Contexto adicional (por si se usa luego)
    sugerencia: sugerencia,
    fixtureId: partido.fixture.id,
  };
}

module.exports = { formatearDatosParaTarjeta };
