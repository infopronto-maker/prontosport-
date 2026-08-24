// ============================================================
// render.js - Versión simplificada (solo usa remotion)
// ============================================================

const { renderMedia } = require('remotion');
const path = require('path');
const fs = require('fs');

async function renderVideo() {
  console.log('🎬 Renderizando video con remotion...');

  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'video.mp4');

  // Renderizar directamente
  await renderMedia({
    codec: 'h264',
    composition: 'ResumenTactico',
    serveUrl: path.join(__dirname, 'index.tsx'),
    outputLocation: outputPath,
    concurrency: 1,
    pixelFormat: 'yuv420p',
    imageFormat: 'jpeg',
    crf: 23,
    renderConfig: {
      width: 1080,
      height: 1920,
    },
  });

  console.log(`✅ Video renderizado: ${outputPath}`);
  return outputPath;
}

if (require.main === module) {
  renderVideo().catch(console.error);
}

module.exports = { renderVideo };
