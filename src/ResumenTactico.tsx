import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

const DORADO = '#FFC933';
const FONDO = '#05100C';
const TEXTO = '#E8F5EE';
const TEXTO_MUTED = '#9BB5A6';

type Props = {
  competencia: string;
  fecha: string;
  equipoA: string;
  equipoB: string;
  marcadorA: number;
  marcadorB: number;
  posesionA: number;
  posesionB: number;
  rematesA: number;
  rematesB: number;
  aPuertaA: number;
  aPuertaB: number;
  cornersA: number;
  cornersB: number;
  estadio: string;
  ganchoFinal: string;
  guion: string;
};

function useSpringIn(delay = 0, config?: Parameters<typeof spring>[0]['config']) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, mass: 0.6, stiffness: 120, ...config },
  });
}

const ContadorNumero: React.FC<{ valor: number; delay: number }> = ({ valor, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progreso = spring({ frame: frame - delay, fps, config: { damping: 18, mass: 0.8 } });
  const actual = Math.round(interpolate(progreso, [0, 1], [0, valor], { extrapolateRight: 'clamp' }));
  return <>{actual}</>;
};

const BarraStat: React.FC<{
  label: string;
  valorA: number;
  valorB: number;
  delay: number;
}> = ({ label, valorA, valorB, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = valorA + valorB || 1;
  const pctA = (valorA / total) * 100;

  const entrada = spring({ frame: frame - delay, fps, config: { damping: 10, mass: 0.7, stiffness: 100 } });
  const anchoBarra = interpolate(entrada, [0, 1], [0, pctA], { extrapolateRight: 'clamp' });
  const opacidad = interpolate(frame - delay, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const deslizamiento = interpolate(entrada, [0, 1], [30, 0]);

  return (
    <div style={{ opacity: opacidad, transform: `translateX(${deslizamiento}px)`, marginBottom: 44 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 34, fontWeight: 700, color: TEXTO }}>
          <ContadorNumero valor={valorA} delay={delay} />
        </span>
        <span style={{ fontSize: 26, letterSpacing: 3, color: TEXTO_MUTED, textTransform: 'uppercase', alignSelf: 'center' }}>
          {label}
        </span>
        <span style={{ fontSize: 34, fontWeight: 700, color: TEXTO }}>
          <ContadorNumero valor={valorB} delay={delay} />
        </span>
      </div>
      <div style={{ height: 14, borderRadius: 7, background: '#16281E', overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${anchoBarra}%`,
            background: DORADO,
            borderRadius: 7,
            boxShadow: `0 0 20px ${DORADO}66`,
          }}
        />
      </div>
    </div>
  );
};

const TextoEscalonado: React.FC<{ texto: string; delay: number; fontSize: number }> = ({ texto, delay, fontSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palabras = texto.split(' ');

  return (
    <div style={{ fontSize, fontWeight: 800, color: TEXTO, lineHeight: 1.2, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {palabras.map((palabra, i) => {
        const retraso = delay + i * 2;
        const entrada = spring({ frame: frame - retraso, fps, config: { damping: 14, mass: 0.5 } });
        const y = interpolate(entrada, [0, 1], [40, 0]);
        const opacidad = interpolate(entrada, [0, 1], [0, 1]);
        return (
          <span key={i} style={{ display: 'inline-block', transform: `translateY(${y}px)`, opacity: opacidad }}>
            {palabra}
          </span>
        );
      })}
    </div>
  );
};

const Bug: React.FC = () => {
  const frame = useCurrentFrame();
  const pulso = 1 + Math.sin(frame / 10) * 0.03;
  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        right: 48,
        fontSize: 22,
        letterSpacing: 4,
        color: TEXTO_MUTED,
        fontWeight: 600,
        transform: `scale(${pulso})`,
      }}
    >
      PRONTO <span style={{ color: DORADO }}>SPORT</span>
    </div>
  );
};

const EscenaApertura: React.FC<Pick<Props, 'competencia' | 'fecha' | 'equipoA' | 'equipoB'>> = ({
  competencia, fecha, equipoA, equipoB,
}) => {
  const entradaA = useSpringIn(5);
  const entradaB = useSpringIn(12);
  const entradaVs = useSpringIn(20, { damping: 6 });

  return (
    <AbsoluteFill style={{ background: FONDO, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 60, left: 48, fontSize: 22, letterSpacing: 3, color: TEXTO_MUTED }}>
        {competencia}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <div style={{
          fontSize: 52, fontWeight: 800, color: TEXTO, textAlign: 'right', width: 380,
          transform: `translateX(${interpolate(entradaA, [0, 1], [-200, 0])}px)`,
          opacity: entradaA,
        }}>
          {equipoA}
        </div>
        <div style={{
          fontSize: 40, color: DORADO, fontWeight: 900,
          transform: `scale(${interpolate(entradaVs, [0, 1], [0, 1])})`,
        }}>
          VS
        </div>
        <div style={{
          fontSize: 52, fontWeight: 800, color: TEXTO, width: 380,
          transform: `translateX(${interpolate(entradaB, [0, 1], [200, 0])}px)`,
          opacity: entradaB,
        }}>
          {equipoB}
        </div>
      </div>
      <div style={{ marginTop: 24, fontSize: 22, color: TEXTO_MUTED }}>{fecha}</div>
    </AbsoluteFill>
  );
};

const EscenaMarcador: React.FC<Pick<Props, 'equipoA' | 'equipoB' | 'marcadorA' | 'marcadorB' | 'estadio'>> = ({
  equipoA, equipoB, marcadorA, marcadorB, estadio,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrada = spring({ frame, fps, config: { damping: 8, mass: 0.9 } });
  const glow = interpolate(Math.sin(frame / 8), [-1, 1], [10, 30]);

  return (
    <AbsoluteFill style={{ background: FONDO, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        transform: `scale(${interpolate(entrada, [0, 1], [0.6, 1])})`,
        opacity: entrada,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 24, color: TEXTO_MUTED, letterSpacing: 2, marginBottom: 20 }}>{estadio}</div>
        <div style={{
          fontSize: 140, fontWeight: 900, color: DORADO,
          textShadow: `0 0 ${glow}px ${DORADO}`,
        }}>
          <ContadorNumero valor={marcadorA} delay={0} /> — <ContadorNumero valor={marcadorB} delay={0} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, fontSize: 28, color: TEXTO, fontWeight: 600 }}>
          <span>{equipoA}</span>
          <span>{equipoB}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EscenaTitular: React.FC<{ guion: string }> = ({ guion }) => {
  const primeraFrase = guion.split('.')[0] + '.';
  return (
    <AbsoluteFill style={{ background: FONDO, justifyContent: 'center', padding: '0 64px' }}>
      <TextoEscalonado texto={primeraFrase} delay={0} fontSize={58} />
    </AbsoluteFill>
  );
};

const EscenaStats: React.FC<Props> = (props) => {
  return (
    <AbsoluteFill style={{ background: FONDO, justifyContent: 'center', padding: '0 56px' }}>
      <div style={{ fontSize: 22, color: TEXTO_MUTED, letterSpacing: 2, marginBottom: 40 }}>
        {props.equipoA} VS {props.equipoB}
      </div>
      <BarraStat label="Posesion" valorA={props.posesionA} valorB={props.posesionB} delay={0} />
      <BarraStat label="Remates" valorA={props.rematesA} valorB={props.rematesB} delay={15} />
      <BarraStat label="A puerta" valorA={props.aPuertaA} valorB={props.aPuertaB} delay={30} />
      <BarraStat label="Corners" valorA={props.cornersA} valorB={props.cornersB} delay={45} />
    </AbsoluteFill>
  );
};

const EscenaCierre: React.FC<{ ganchoFinal: string }> = ({ ganchoFinal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entradaCta = spring({ frame: frame - 30, fps, config: { damping: 10 } });
  const glow = interpolate(Math.sin(frame / 6), [-1, 1], [5, 20]);

  return (
    <AbsoluteFill style={{ background: FONDO, justifyContent: 'center', alignItems: 'center', padding: '0 64px' }}>
      <TextoEscalonado texto={ganchoFinal} delay={0} fontSize={54} />
      <div style={{
        marginTop: 44,
        fontSize: 26,
        letterSpacing: 3,
        color: DORADO,
        fontWeight: 700,
        opacity: entradaCta,
        transform: `translateY(${interpolate(entradaCta, [0, 1], [20, 0])}px)`,
        textShadow: `0 0 ${glow}px ${DORADO}88`,
      }}>
        → RESPONDE EN COMENTARIOS
      </div>
    </AbsoluteFill>
  );
};

export const ResumenTactico: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: fadeOut, fontFamily: 'Arial, sans-serif' }}>
      <Sequence from={0} durationInFrames={120}>
        <EscenaMarcador {...props} />
      </Sequence>
      <Sequence from={120} durationInFrames={90}>
        <EscenaApertura {...props} />
      </Sequence>
      <Sequence from={210} durationInFrames={180}>
        <EscenaTitular guion={props.guion} />
      </Sequence>
      <Sequence from={390} durationInFrames={210}>
        <EscenaStats {...props} />
      </Sequence>
      <Sequence from={600} durationInFrames={120}>
        <EscenaCierre ganchoFinal={props.ganchoFinal} />
      </Sequence>
      <Bug />
    </AbsoluteFill>
  );
};
