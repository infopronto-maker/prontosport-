// ============================================================
// render.js - Renderiza el video con Remotion
// ============================================================

const { bundle } = require('@remotion/bundler');
const { renderMedia } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

async function renderVideo() {
  console.log('🎬 Iniciando renderizado del video...');

  try {
    // 1. Asegurar que existe la carpeta de salida
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'video.mp4');

    // 2. Configurar Remotion - USANDO index.tsx como punto de entrada
    const entry = path.join(__dirname, 'index.tsx');
    console.log(`📂 Usando punto de entrada: ${entry}`);

    const bundled = await bundle(entry, () => undefined);

    // 3. Renderizar el video
    console.log('🎞️ Renderizando video...');
    await renderMedia({
      codec: 'h264',
      composition: 'ResumenTactico',
      serveUrl: bundled,
      outputLocation: outputPath,
      concurrency: 1,
      pixelFormat: 'yuv420p',
      imageFormat: 'jpeg',
      crf: 23,
      scale: 1,
      chrominanceSubsampling: '4:2:0',
      renderConfig: {
        width: 1080,
        height: 1920,
      },
    });

    console.log(`✅ Video renderizado exitosamente: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error('❌ Error renderizando video:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  renderVideo().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { renderVideo };
