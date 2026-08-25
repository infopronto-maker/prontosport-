// ============================================================
// config.js - Configuración definitiva
// ============================================================

module.exports = {
  MAX_PIEZAS: 5,
  DIAS_BUSQUEDA: 3,

  EQUIPOS_PRIORITARIOS: [
    'River Plate', 'Boca Juniors', 'Flamengo', 'Palmeiras',
    'Nacional', 'Millonarios', 'Santa Fe', 'América de Cali',
    'Club América', 'Chivas', 'Cruz Azul', 'Pumas'
  ],

  LIGAS_OBJETIVO: [
    { busqueda: 'Primera A', pais: 'Colombia' },
    { busqueda: 'Liga Profesional', pais: 'Argentina' },
    { busqueda: 'Serie A', pais: 'Brasil' },
    { busqueda: 'Liga MX', pais: 'Mexico' },
    { busqueda: 'Libertadores', pais: null },
    { busqueda: 'Sudamericana', pais: null },
  ],

  GEMINI: {
    MODELO: 'gemini-2.5-flash',
    TEMPERATURA: 0.7,
    MAX_TOKENS: 1000,
    INTENTOS_MAX: 3,
    ESPERA_BASE: 60000,
    ESPERA_MAX: 180000,
  },

  RUTAS: {
    DATOS: 'data/',
    VIDEO_SALIDA: 'output/',
  },

  SUPABASE: {
    BUCKET: 'videos',
    URL: process.env.SUPABASE_URL,
    KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
};
