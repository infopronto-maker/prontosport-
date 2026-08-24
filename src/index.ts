import { Composition } from 'remotion';
import { ResumenTactico } from './ResumenTactico';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ResumenTactico"
      component={ResumenTactico}
      durationInFrames={720}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        competencia: 'LIGA BETPLAY',
        fecha: '23 de agosto de 2026',
        equipoA: 'INDEPENDIENTE MEDELLIN',
        equipoB: 'CUCUTA',
        marcadorA: 0,
        marcadorB: 1,
        posesionA: 55,
        posesionB: 45,
        rematesA: 14,
        rematesB: 6,
        aPuertaA: 3,
        aPuertaB: 2,
        cornersA: 3,
        cornersB: 1,
        estadio: 'Estadio Atanasio Girardot',
        ganchoFinal: '¿Sirve tener más balón si no generas peligro real?',
        guion: 'Cucuta logro una victoria crucial de visitante.',
      }}
    />
  );
};
