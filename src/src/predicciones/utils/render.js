// ============================================================
// src/src/predicciones/utils/render.js
// ============================================================
// Renderiza la tarjeta de predicción usando canvas
// ============================================================

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { obtenerDiseno } = require('../templates/estructura.js');

async function renderizarTarjeta(datosPartido) {
  const diseno = obtenerDiseno(datosPartido);
  const canvas = createCanvas(diseno.ancho, diseno.alto);
  const ctx = canvas.getContext('2d');

  // Fondo
  ctx.fillStyle = diseno.colorFondo;
  ctx.fillRect(0, 0, diseno.ancho, diseno.alto);

  // Borde superior (color dinámico)
  ctx.fillStyle = diseno.colorAcento;
  ctx.fillRect(0, 0, diseno.ancho, 15);

  // Título
  ctx.fillStyle = diseno.colorTexto;
  ctx.font = diseno.fuentes.titulo;
  ctx.textAlign = 'center';
  ctx.fillText('PREDICCIÓN', diseno.posiciones.titulo.x, diseno.posiciones.titulo.y);

  // Liga
  ctx.fillStyle = diseno.colorSecundario;
  ctx.font = diseno.fuentes.liga;
  ctx.fillText(datosPartido.liga || 'Liga', diseno.posiciones.liga.x, diseno.posiciones.liga.y);

  // Equipos
  ctx.fillStyle = diseno.colorTexto;
  ctx.font = diseno.fuentes.equipo;
  ctx.fillText(datosPartido.local, diseno.posiciones.equipoLocal.x, diseno.posiciones.equipoLocal.y);
  ctx.font = diseno.fuentes.vs;
  ctx.fillStyle = diseno.colorAcento;
  ctx.fillText('VS', diseno.posiciones.vs.x, diseno.posiciones.vs.y);
  ctx.fillStyle = diseno.colorTexto;
  ctx.font = diseno.fuentes.equipo;
  ctx.fillText(datosPartido.visitante, diseno.posiciones.equipoVisitante.x, diseno.posiciones.equipoVisitante.y);

  // Fecha
  ctx.fillStyle = diseno.colorSecundario;
  ctx.font = diseno.fuentes.fecha;
  ctx.fillText(
    `${datosPartido.fecha || ''} • ${datosPartido.hora || ''}`,
    diseno.posiciones.fecha.x,
    diseno.posiciones.fecha.y
  );

  // Predicción estrella
  const fondo = diseno.posiciones.prediccionFondo;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.roundRect(fondo.x, fondo.y, fondo.ancho, fondo.alto, 20);
  ctx.fill();

  ctx.fillStyle = diseno.colorTexto;
  ctx.font = diseno.fuentes.prediccion;
  ctx.fillText(
    datosPartido.prediccion || 'Predicción',
    diseno.posiciones.prediccionTexto.x,
    diseno.posiciones.prediccionTexto.y
  );

  ctx.fillStyle = diseno.colorRojo;
  ctx.font = diseno.fuentes.cuota;
  ctx.fillText(
    `Cuota: ${datosPartido.cuota || '@1.85'}`,
    diseno.posiciones.prediccionCuota.x,
    diseno.posiciones.prediccionCuota.y
  );

  ctx.fillStyle = diseno.colorAcento;
  ctx.font = diseno.fuentes.valor;
  ctx.fillText(
    `Valor: ${datosPartido.valor || '+15%'}`,
    diseno.posiciones.prediccionValor.x,
    diseno.posiciones.prediccionValor.y
  );

  // Probabilidades 1X2
  ctx.fillStyle = diseno.colorTexto;
  ctx.font = diseno.fuentes.probTitulo;
  ctx.fillText('PROBABILIDADES 1X2', diseno.posiciones.probTitulo.x, diseno.posiciones.probTitulo.y);

  ctx.font = diseno.fuentes.probNumero;
  ctx.fillStyle = diseno.colorAcento;
  ctx.fillText(`${datosPartido.prob_local || 0}%`, diseno.posiciones.probLocal.x, diseno.posiciones.probLocal.y);
  ctx.fillStyle = diseno.colorAmarillo;
  ctx.fillText(`${datosPartido.prob_empate || 0}%`, diseno.posiciones.probEmpate.x, diseno.posiciones.probEmpate.y);
  ctx.fillStyle = diseno.colorRojo;
  ctx.fillText(`${datosPartido.prob_visitante || 0}%`, diseno.posiciones.probVisitante.x, diseno.posiciones.probVisitante.y);

  ctx.fillStyle = diseno.colorSecundario;
  ctx.font = diseno.fuentes.probLabel;
  ctx.fillText('Local', diseno.posiciones.probLabelLocal.x, diseno.posiciones.probLabelLocal.y);
  ctx.fillText('Empate', diseno.posiciones.probLabelEmpate.x, diseno.posiciones.probLabelEmpate.y);
  ctx.fillText('Visitante', diseno.posiciones.probLabelVisitante.x, diseno.posiciones.probLabelVisitante.y);

  // Promedios
  ctx.fillStyle = diseno.colorTexto;
  ctx.font = diseno.fuentes.promediosTitulo;
  ctx.fillText('PROMEDIOS CLAVE', diseno.posiciones.promediosTitulo.x, diseno.posiciones.promediosTitulo.y);

  ctx.font = diseno.fuentes.promediosValor;
  ctx.fillStyle = diseno.colorTexto;
  ctx.fillText(
    `⚽ Córners: ${datosPartido.corners_local || 0} / ${datosPartido.corners_visitante || 0}`,
    diseno.posiciones.promediosCorners.x,
    diseno.posiciones.promediosCorners.y
  );
  ctx.fillText(
    `⚽ Goles: ${datosPartido.goles_local || 0} / ${datosPartido.goles_visitante || 0}`,
    diseno.posiciones.promediosGoles.x,
    diseno.posiciones.promediosGoles.y
  );

  // Footer
  ctx.fillStyle = diseno.colorSecundario;
  ctx.font = diseno.fuentes.footer;
  ctx.fillText('¿Qué piensas de este pick? Comparte tu opinión', diseno.posiciones.footer.x, diseno.posiciones.footer.y);

  return canvas;
}

async function generarImagen(datosPartido, nombreArchivo) {
  const canvas = await renderizarTarjeta(datosPartido);
  const buffer = canvas.toBuffer('image/png');

  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const rutaSalida = path.join(outputDir, nombreArchivo);
  fs.writeFileSync(rutaSalida, buffer);
  console.log(`✅ Tarjeta guardada: ${rutaSalida}`);
  return rutaSalida;
}

module.exports = { renderizarTarjeta, generarImagen };
