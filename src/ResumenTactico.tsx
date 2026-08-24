// ============================================================
// ResumenTactico.tsx - Componente principal de Remotion
// ============================================================

import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, useCurrentFrame } from 'remotion';
import data from '../data/partido-video.json';

// Definir tipos
interface VideoData {
  competencia: string;
  fecha: string;
  equipoA: string;
  equipoB: string;
  marcadorA: number;
  marcadorB: number;
  estadio: string;
  ganchoFinal: string;
  guion: string;
  posesionA: number;
  posesionB: number;
  rematesA: number;
  rematesB: number;
  aPuertaA: number;
  aPuertaB: number;
  cornersA: number;
  cornersB: number;
  faltasA: number;
  faltasB: number;
  amarillasA: number;
  amarillasB: number;
  rojasA: number;
  rojasB: number;
}

// Estilos
const styles = {
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0a1a',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    position: 'relative' as const,
  },
  header: {
    position: 'absolute' as const,
    top: 30,
    left: 40,
    color: '#e94560',
    fontSize: 28,
    fontWeight: 'bold' as const,
    letterSpacing: 2,
  },
  date: {
    position: 'absolute' as const,
    top: 30,
    right: 40,
    color: '#8892b0',
    fontSize: 18,
  },
  teams: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginBottom: 30,
  },
  teamName: {
    fontSize: 42,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  score: {
    fontSize: 56,
    fontWeight: 'bold' as const,
    color: '#e94560',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 15,
    width: '80%',
    maxWidth: 800,
    marginBottom: 20,
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 8,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  statLabel: {
    color: '#8892b0',
    fontSize: 18,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  narrative: {
    color: '#ccd6f6',
    fontSize: 22,
    textAlign: 'center' as const,
    maxWidth: 800,
    lineHeight: 1.4,
    marginBottom: 20,
    padding: '0 20px',
  },
  hook: {
    color: '#e94560',
    fontSize: 26,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 30,
    right: 40,
    color: '#8892b0',
    fontSize: 14,
  },
};

export const ResumenTactico: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const typedData = data as VideoData;

  // Animación de entrada
  const opacity = interpolate(
    frame,
    [0, 15],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const translateY = interpolate(
    frame,
    [0, 15],
    [20, 0],
    { extrapolateRight: 'clamp' }
  );

  // Mostrar diferentes secciones según el tiempo
  const showNarrative = frame > 30 && frame < durationInFrames - 30;
  const showStats = frame > 60 && frame < durationInFrames - 60;
  const showHook = frame > durationInFrames - 60;

  return (
    <AbsoluteFill style={styles.container}>
      {/* Header */}
      <div style={{ ...styles.header, opacity, transform: `translateY(${translateY}px)` }}>
        {typedData.competencia}
      </div>
      <div style={{ ...styles.date, opacity, transform: `translateY(${translateY}px)` }}>
        {typedData.fecha}
      </div>

      {/* Equipos y marcador */}
      <div style={{ ...styles.teams, opacity, transform: `translateY(${translateY}px)` }}>
        <span style={styles.teamName}>{typedData.equipoA}</span>
        <span style={styles.score}>{typedData.marcadorA} - {typedData.marcadorB}</span>
        <span style={styles.teamName}>{typedData.equipoB}</span>
      </div>

      {/* Narrativa */}
      {showNarrative && (
        <div style={{ ...styles.narrative, opacity, transform: `translateY(${translateY}px)` }}>
          {typedData.guion}
        </div>
      )}

      {/* Estadísticas */}
      {showStats && (
        <div style={{ ...styles.statsGrid, opacity, transform: `translateY(${translateY}px)` }}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>⚽ Posesión</span>
            <span style={styles.statValue}>{typedData.posesionA}% - {typedData.posesionB}%</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>🎯 Remates</span>
            <span style={styles.statValue}>{typedData.rematesA} - {typedData.rematesB}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>📐 Remates a puerta</span>
            <span style={styles.statValue}>{typedData.aPuertaA} - {typedData.aPuertaB}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>🔄 Córners</span>
            <span style={styles.statValue}>{typedData.cornersA} - {typedData.cornersB}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>⚠️ Faltas</span>
            <span style={styles.statValue}>{typedData.faltasA} - {typedData.faltasB}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>🟨 Tarjetas amarillas</span>
            <span style={styles.statValue}>{typedData.amarillasA} - {typedData.amarillasB}</span>
          </div>
        </div>
      )}

      {/* Gancho final */}
      {showHook && (
        <div style={{ ...styles.hook, opacity, transform: `translateY(${translateY}px)` }}>
          {typedData.ganchoFinal}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        🎬 ProntoSport • Generado con IA
      </div>
    </AbsoluteFill>
  );
};
