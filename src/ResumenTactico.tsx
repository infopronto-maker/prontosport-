import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

// ---- DATOS DE EJEMPLO ----
// Estos datos se reemplazarán más adelante por los que genera
// generar-radiografia.js. Por ahora están fijos para poder
// renderizar y ver el resultado.
export type PartidoData = {
  competencia: string;
  fecha: string;
  equipoA: string;
  equipoB: string;
  posesionA: number;
  posesionB: number;
  rematesA: number;
  rematesB: number;
  aPuertaA: number;
  aPuertaB: number;
  cornersA: number;
  cornersB: number;
  marcadorA: number;
  marcadorB: number;
  estadio: string;
  ganchoFinal: string;
};

export const datosEjemplo: PartidoData = {
  competencia: 'ELIMINATORIAS · FECHA 12',
  fecha: '8 JUL 2026',
  equipoA: 'COLOMBIA',
  equipoB: 'PARAGUAY',
  posesionA: 68,
  posesionB: 32,
  rematesA: 14,
  rematesB: 6,
  aPuertaA: 3,
  aPuertaB: 2,
  cornersA: 5,
  cornersB: 1,
  marcadorA: 1,
  marcadorB: 1,
  estadio: 'Estadio Metropolitano',
  ganchoFinal: '¿Sirve tener más balón si no generas peligro real?',
};

const COLOR_BG = '#05100C';
const COLOR_ACCENT = '#FFC933';
const COLOR_TEXT = '#F2EFE4';
const COLOR_MUTED = '#7C8B83';

// ---------- ACTO 1: HOOK (con contador tipo "Stat Counter") ----------
const ActoHook: React.FC<{ data: PartidoData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [20, 0]);

  const countProgress = spring({
    frame: frame - 6,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const numeroActual = Math.round(
    interpolate(countProgress, [0, 1], [0, data.posesionA], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        padding: '0 70px',
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 26,
          color: COLOR_ACCENT,
          letterSpacing: 4,
          marginBottom: 20,
        }}
      >
        POSESIÓN DE BALÓN
      </div>
      <div
        style={{
          fontSize: 92,
          fontWeight: 800,
          color: COLOR_TEXT,
          lineHeight: 1.05,
          letterSpacing: -1,
        }}
      >
        {data.equipoA}
        <br />
        TUVO{' '}
        <span style={{ color: COLOR_ACCENT, fontVariantNumeric: 'tabular-nums' }}>
          {numeroActual}%
        </span>
        <br />
        DEL BALÓN.
      </div>
    </AbsoluteFill>
  );
};

// ---------- ACTO 2: BARRAS COMPARATIVAS ----------
const BarraStat: React.FC<{
  label: string;
  valorA: number;
  valorB: number;
  maxValor: number;
  delay: number;
}> = ({ label, valorA, valorB, maxValor, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });
  const widthPct = interpolate(progress, [0, 1], [0, (valorA / maxValor) * 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const numeroAnimado = Math.round(
    interpolate(progress, [0, 1], [0, valorA], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  return (
    <div style={{ marginBottom: 46 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 30,
          fontWeight: 700,
          color: COLOR_TEXT,
          marginBottom: 14,
        }}
      >
        <span>{label}</span>
        <span style={{ color: COLOR_MUTED, fontVariantNumeric: 'tabular-nums' }}>
          {numeroAnimado} — {valorB}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 22,
          background: 'rgba(242,239,228,0.08)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${widthPct}%`,
            background: COLOR_ACCENT,
            borderRadius: 12,
          }}
        />
      </div>
    </div>
  );
};

const ActoBarras: React.FC<{ data: PartidoData }> = ({ data }) => {
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: '0 70px' }}>
      <div
        style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 24,
          color: COLOR_MUTED,
          letterSpacing: 3,
          marginBottom: 50,
          textTransform: 'uppercase',
        }}
      >
        {data.equipoA} vs {data.equipoB}
      </div>
      <BarraStat
        label="Remates"
        valorA={data.rematesA}
        valorB={data.rematesB}
        maxValor={Math.max(data.rematesA, data.rematesB)}
        delay={0}
      />
      <BarraStat
        label="A puerta"
        valorA={data.aPuertaA}
        valorB={data.aPuertaB}
        maxValor={Math.max(data.aPuertaA, data.aPuertaB)}
        delay={6}
      />
      <BarraStat
        label="Córners"
        valorA={data.cornersA}
        valorB={data.cornersB}
        maxValor={Math.max(data.cornersA, data.cornersB)}
        delay={12}
      />
    </AbsoluteFill>
  );
};

// ---------- ACTO 3: MARCADOR ----------
const ActoMarcador: React.FC<{ data: PartidoData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });

  const countProgress = spring({
    frame: frame - 8,
    fps,
    config: { damping: 200 },
    durationInFrames: 15,
  });
  const golesA = Math.round(
    interpolate(countProgress, [0, 1], [0, data.marcadorA], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const golesB = Math.round(
    interpolate(countProgress, [0, 1], [0, data.marcadorB], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${interpolate(scale, [0, 1], [0.85, 1])})`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 50,
          border: `2px solid ${COLOR_ACCENT}55`,
          borderRadius: 16,
          padding: '40px 60px',
          background: 'rgba(255,201,51,0.05)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, color: COLOR_TEXT, fontWeight: 700, marginBottom: 10 }}>
            {data.equipoA}
          </div>
          <div
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 90,
              fontWeight: 800,
              color: COLOR_TEXT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {golesA}
          </div>
        </div>
        <div style={{ fontSize: 50, color: COLOR_MUTED }}>—</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, color: COLOR_TEXT, fontWeight: 700, marginBottom: 10 }}>
            {data.equipoB}
          </div>
          <div
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 90,
              fontWeight: 800,
              color: COLOR_TEXT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {golesB}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: 'Courier New, monospace',
          fontSize: 20,
          color: COLOR_MUTED,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {data.estadio}
      </div>
    </AbsoluteFill>
  );
};

// ---------- ACTO 4: GANCHO DE CIERRE ----------
const ActoGancho: React.FC<{ data: PartidoData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: '0 70px', opacity }}>
      <div style={{ fontSize: 60, fontWeight: 700, color: COLOR_TEXT, lineHeight: 1.25 }}>
        {data.ganchoFinal}
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily: 'Courier New, monospace',
          fontSize: 24,
          color: COLOR_ACCENT,
          letterSpacing: 2,
        }}
      >
        → RESPONDE EN COMENTARIOS
      </div>
    </AbsoluteFill>
  );
};

// ---------- MARCA DE AGUA / ELEMENTOS FIJOS ----------
const Marca: React.FC<{ data: PartidoData }> = ({ data }) => (
  <>
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 60,
        fontFamily: 'Courier New, monospace',
        fontSize: 20,
        color: COLOR_MUTED,
        letterSpacing: 3,
        textTransform: 'uppercase',
      }}
    >
      {data.competencia}
    </div>
    <div
      style={{
        position: 'absolute',
        top: 60,
        right: 60,
        fontFamily: 'Courier New, monospace',
        fontSize: 20,
        color: '#4A5850',
        letterSpacing: 2,
      }}
    >
      PRONTO SPORT
    </div>
  </>
);

// ---------- COMPOSICIÓN PRINCIPAL ----------
export const ResumenTactico: React.FC<{ data?: PartidoData }> = ({
  data = datosEjemplo,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BG, fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <Marca data={data} />

      <Sequence from={0} durationInFrames={90}>
        <ActoHook data={data} />
      </Sequence>

      <Sequence from={90} durationInFrames={90}>
        <ActoBarras data={data} />
      </Sequence>

      <Sequence from={180} durationInFrames={90}>
        <ActoMarcador data={data} />
      </Sequence>

      <Sequence from={270} durationInFrames={90}>
        <ActoGancho data={data} />
      </Sequence>
    </AbsoluteFill>
  );
};
