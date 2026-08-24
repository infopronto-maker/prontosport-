// ============================================================
// config.js - Configuración centralizada
// ============================================================

module.exports = {
  // Límites y cantidad de partidos
  MAX_PIEZAS: 5,
  DIAS_BUSQUEDA: 3,

  // Ligas objetivo para priorizar
  LIGAS_OBJETIVO: [
    { busqueda: 'World Cup', pais: null },
    { busqueda: 'Primera A', pais: 'Colombia' },
    { busqueda: 'Libertadores', pais: null },
    { busqueda: 'Sudamericana', pais: null },
  ],

  // Configuración de Gemini
  GEMINI: {
    MODELO: 'gemini-2.5-flash',
    TEMPERATURA: 0.7,
    MAX_TOKENS: 500,
    INTENTOS_MAX: 5,
    ESPERA_BASE: 60000, // 1 minuto
    ESPERA_MAX: 300000, // 5 minutos
  },

  // Rutas de archivos
  RUTAS: {
    DATOS: 'data/',
    HISTORIAL: 'historial/',
    VIDEO_SALIDA: 'output/video.mp4',
  },
};
