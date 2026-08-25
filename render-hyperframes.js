require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const config = require('./config.js');

function renderVideo(htmlContent, outputPath) {
  return new Promise((resolve, reject) => {
    const tempHtml = 'temp.html';
    try {
      fs.writeFileSync(tempHtml, htmlContent, 'utf8');
    } catch (err) {
      reject(new Error(`Error al escribir temp.html: ${err.message}`));
      return;
    }

    const cmd = `npx hyperframes render -c "${tempHtml}" -o "${outputPath}"`;
    console.log(`▶️ Ejecutando: ${cmd}`);

    exec(cmd, (error, stdout, stderr) => {
      try { fs.unlinkSync(tempHtml); } catch (e) {}
      if (error) {
        reject(new Error(`Error al renderizar: ${stderr || error.message}`));
        return;
      }
      console.log(`✅ Video renderizado: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

async function subirSupabase(filePath) {
  const supabase = createClient(config.SUPABASE.URL, config.SUPABASE.KEY);
  const nombre = path.basename(filePath);
  const data = fs.readFileSync(filePath);
  const { error } = await supabase.storage
    .from(config.SUPABASE.BUCKET)
    .upload(nombre, data, { contentType: 'video/mp4', upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from(config.SUPABASE.BUCKET)
    .getPublicUrl(nombre);
  return publicUrl;
}

async function main() {
  console.log('🚀 Renderizando videos con HyperFrames...');
  const dataPath = path.join(config.RUTAS.DATOS, 'partidos-html.json');

  if (!fs.existsSync(dataPath)) {
    console.log('⚠️ No hay datos para renderizar. Saliendo.');
    return;
  }

  const partidos = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  if (!partidos.length) {
    console.log('⚠️ No hay partidos.');
    return;
  }

  const outputDir = config.RUTAS.VIDEO_SALIDA;
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const urls = [];
  for (let i = 0; i < partidos.length; i++) {
    const p = partidos[i];
    const out = path.join(outputDir, `video-${i + 1}.mp4`);
    console.log(`\n📹 ${p.local} vs ${p.visitante}`);
    await renderVideo(p.html, out);
    const url = await subirSupabase(out);
    urls.push(url);
    console.log(`🔗 Enlace público: ${url}`);
  }

  console.log(`\n✅ ${urls.length} videos subidos a Supabase`);
  fs.writeFileSync('data/urls.json', JSON.stringify(urls, null, 2));
}

if (require.main === module) main();
module.exports = { renderVideo, subirSupabase };
