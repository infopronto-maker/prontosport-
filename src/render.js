// ============================================================
// render.js - Renderiza videos usando @remotion/renderer y @remotion/bundler
// ============================================================

const { bundle } = require('@remotion/bundler');
const { renderMedia } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

async function renderVideo(partidoIndex, serveUrl) {
  console.log(`🎬 Renderizando video para partido ${partidoIndex + 1}...`);

  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `video-partido-${partidoIndex + 1}.mp4`);

  await renderMedia({
    codec: 'h264',
    composition: 'ResumenTactico',
    serveUrl: serveUrl,
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

async function renderAllVideos() {
  console.log('🚀 Iniciando renderizado de TODOS los partidos...');

  try {
    // 1. Crear el bundle de Remotion
    console.log('📦 Creando bundle de Remotion...');
    const entryPoint = path.join(__dirname, 'index.tsx');
    const serveUrl = await bundle(entryPoint, () => undefined);
    console.log(`✅ Bundle creado: ${serveUrl}`);

    // 2. Leer los datos de los partidos
    const dataPath = path.join(__dirname, '..', 'data', 'contenido-hoy.json');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ No existe data/contenido-hoy.json');
      return;
    }

    const partidos = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (!partidos.length) {
      console.log('⚠️ No hay partidos para renderizar');
      return;
    }

    console.log(`📊 ${partidos.length} partidos encontrados`);

    // 3. Renderizar un video por cada partido
    const resultados = [];
    for (let i = 0; i < partidos.length; i++) {
      // Guardar el partido actual en partido-video.json para que Remotion lo use
      const videoDataPath = path.join(__dirname, '..', 'data', 'partido-video.json');
      fs.writeFileSync(videoDataPath, JSON.stringify(partidos[i], null, 2));

      // Renderizar el video
      const outputPath = await renderVideo(i, serveUrl);
      resultados.push(outputPath);
    }

    console.log(`✅ ${resultados.length} videos renderizados exitosamente`);
    return resultados;

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  renderAllVideos().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { renderAllVideos, renderVideo };
