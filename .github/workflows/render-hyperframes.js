// ============================================================
// render-hyperframes.js - Renderiza HTML a MP4 con HyperFrames
// ============================================================

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const config = require('./config.js');

async function renderVideo(htmlContent, outputPath) {
  console.log(`🎬 Renderizando video: ${outputPath}`);

  // Crear carpeta temporal
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Guardar HTML temporal
  const tempHtml = path.join(tempDir, 'video.html');
  fs.writeFileSync(tempHtml, htmlContent);

  // Renderizar con HyperFrames
  return new Promise((resolve, reject) => {
    const cmd = `npx hyperframes render ${tempHtml} -o ${outputPath}`;
    console.log(`   ▶️ Ejecutando: ${cmd}`);

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`   ⚠️ Stderr: ${stderr}`);
      }
      if (stdout) {
        console.log(`   📋 Output: ${stdout}`);
      }

      // Limpiar archivo temporal
      fs.unlinkSync(tempHtml);
      console.log(`   ✅ Video renderizado: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

async function renderAllVideos() {
  console.log('🚀 Iniciando renderizado de todos los partidos con HyperFrames...');

  try {
    // Leer datos
    const dataPath = path.join(config.RUTAS.DATOS, 'partidos-html.json');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ No existe data/partidos-html.json');
      console.log('   Ejecuta primero: node generar-guion.js');
      return;
    }

    const partidos = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (!partidos.length) {
      console.log('⚠️ No hay partidos para renderizar');
      return;
    }

    console.log(`📊 ${partidos.length} partidos encontrados`);

    // Crear carpeta de salida
    const outputDir = config.RUTAS.VIDEO_SALIDA;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Renderizar cada partido
    const resultados = [];
    for (let i = 0; i < partidos.length; i++) {
      const partido = partidos[i];
      const outputPath = path.join(outputDir, `video-partido-${i + 1}.mp4`);

      console.log(`\n📹 Partido ${i + 1}/${partidos.length}: ${partido.local} vs ${partido.visitante}`);
      await renderVideo(partido.html, outputPath);
      resultados.push(outputPath);
    }

    console.log(`\n✅ ${resultados.length} videos renderizados exitosamente`);
    console.log(`   📁 Carpeta: ${outputDir}`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  renderAllVideos();
}

module.exports = { renderVideo, renderAllVideos };
