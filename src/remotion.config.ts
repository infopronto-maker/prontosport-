// ============================================================
// remotion.config.ts - Configuración de Remotion
// ============================================================

import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(23);
Config.setScale(1);

// Configuración para TikTok (vertical)
Config.setConcurrency(1);
Config.setChromiumOptions({
  width: 1080,
  height: 1920,
});
