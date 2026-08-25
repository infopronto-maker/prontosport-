// ============================================================
// src/predicciones/templates/estructura.js
// ============================================================
// Define el diseño de la tarjeta de predicción.
// ============================================================

const COLORES = {
  fondo: '#0a0a1a',
  texto: '#ffffff',
  texto_secundario: '#8892b0',
  acento_local: '#2ecc71',   // Verde (Local favorito)
  acento_visitante: '#3498db', // Azul (Visitante favorito)
  rojo_destacado: '#e94560',
  amarillo: '#f1c40f',
};

function obtenerDiseno(partido) {
  const colorAcento = partido.prob_local >= 52 
    ? COLORES.acento_local 
    : COLORES.acento_visitante;

  return {
    ancho: 1080,
    alto: 1920,
    colorFondo: COLORES.fondo,
    colorTexto: COLORES.texto,
    colorSecundario: COLORES.texto_secundario,
    colorAcento: colorAcento,
    colorRojo: COLORES.rojo_destacado,
    colorAmarillo: COLORES.amarillo,
    posiciones: {
      titulo: { x: 540, y: 100 },
      liga: { x: 540, y: 170 },
      fecha: { x: 540, y: 450 },
      equipoLocal: { x: 340, y: 350 },
      vs: { x: 540, y: 350 },
      equipoVisitante: { x: 740, y: 350 },
      prediccionFondo: { x: 100, y: 500, ancho: 880, alto: 200 },
      prediccionTexto: { x: 540, y: 580 },
      prediccionCuota: { x: 540, y: 640 },
      prediccionValor: { x: 540, y: 700 },
      probTitulo: { x: 540, y: 820 },
      probLocal: { x: 340, y: 880 },
      probEmpate: { x: 540, y: 880 },
      probVisitante: { x: 740, y: 880 },
      probLabelLocal: { x: 340, y: 920 },
      probLabelEmpate: { x: 540, y: 920 },
      probLabelVisitante: { x: 740, y: 920 },
      promediosTitulo: { x: 540, y: 1020 },
      promediosCorners: { x: 540, y: 1100 },
      promediosGoles: { x: 540, y: 1160 },
      footer: { x: 540, y: 1850 },
    },
    fuentes: {
      titulo: 'bold 48px Arial',
      liga: '36px Arial',
      fecha: '32px Arial',
      equipo: 'bold 60px Arial',
      vs: 'bold 48px Arial',
      prediccion: 'bold 48px Arial',
      cuota: '36px Arial',
      valor: '36px Arial',
      probTitulo: 'bold 32px Arial',
      probNumero: 'bold 28px Arial',
      probLabel: '24px Arial',
      promediosTitulo: 'bold 32px Arial',
      promediosValor: '28px Arial',
      footer: '24px Arial',
    },
  };
}

module.exports = { COLORES, obtenerDiseno };
