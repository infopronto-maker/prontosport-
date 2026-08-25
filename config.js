// ============================================================
// config.js - Configuración para FÚTBOL LATINOAMERICANO
// ============================================================

module.exports = {
  // Límites
  MAX_PIEZAS: 5,
  DIAS_BUSQUEDA: 3,

  // EQUIPOS PRIORITARIOS (Latinoamérica)
  EQUIPOS_PRIORITARIOS: [
    // Argentina
    'River Plate', 'Boca Juniors', 'Independiente', 'Racing', 'San Lorenzo',
    // Brasil
    'Flamengo', 'Palmeiras', 'Santos', 'Corinthians', 'São Paulo',
    'Grêmio', 'Internacional',
    // Colombia
    'Nacional', 'Millonarios', 'Santa Fe', 'América de Cali', 'Junior',
    'Tolima', 'Medellín', 'Cali',
    // México
    'América', 'Chivas', 'Cruz Azul', 'Pumas', 'Monterrey', 'Tigres',
    // Chile
    'Colo-Colo', 'Universidad de Chile', 'Universidad Católica',
    // Uruguay
    'Peñarol', 'Nacional',
    // Perú
    'Universitario', 'Alianza Lima', 'Sporting Cristal',
    // Ecuador
    'Barcelona SC', 'Emelec', 'LDU Quito', 'Independiente del Valle',
    // Paraguay
    'Olimpia', 'Cerro Porteño', 'Libertad',
    // Bolivia
    'Bolívar', 'The Strongest',
    // Venezuela
    'Caracas', 'Táchira', 'Zamora',
  ],

  // Ligas objetivo (Latinoamérica)
  LIGAS_OBJETIVO: [
    { busqueda: 'Primera A', pais: 'Colombia' },
    { busqueda: 'Liga Profesional', pais: 'Argentina' },
    { busqueda: 'Serie A', pais: 'Brasil' },
    { busqueda: 'Liga MX', pais: 'Mexico' },
    { busqueda: 'Primera División', pais: 'Chile' },
    { busqueda: 'Primera División', pais: 'Uruguay' },
    { busqueda: 'Liga 1', pais: 'Peru' },
    { busqueda: 'Serie A', pais: 'Ecuador' },
    { busqueda: 'Primera División', pais: 'Paraguay' },
    { busqueda: 'Primera División', pais: 'Bolivia' },
    { busqueda: 'Primera División', pais: 'Venezuela' },
    { busqueda: 'Libertadores', pais: null },
    { busqueda: 'Sudamericana', pais: null },
  ],

  // Configuración de Gemini
  GEMINI: {
    MODELO: 'gemini-2.5-flash',
    TEMPERATURA: 0.7,
    MAX_TOKENS: 500,
    INTENTOS_MAX: 3,
    ESPERA_BASE: 60000,
    ESPERA_MAX: 180000,
  },

  // Rutas
  RUTAS: {
    DATOS: 'data/',
    HISTORIAL: 'historial/',
    VIDEO_SALIDA: 'output/video.mp4',
  },
};
