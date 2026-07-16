import { registerRoot, Composition } from 'remotion';
import React from 'react';
import { ResumenTactico, datosEjemplo } from './ResumenTactico';

const RemotionRoot: React.FC = () => {
  return React.createElement(
    Composition,
    {
      id: 'ResumenTactico',
      component: ResumenTactico,
      durationInFrames: 360, // 12 segundos a 30fps
      fps: 30,
      width: 1080,
      height: 1920,
      defaultProps: { data: datosEjemplo },
    }
  );
};

registerRoot(RemotionRoot);
