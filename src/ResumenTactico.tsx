// ============================================================
// ResumenTactico.tsx - Diseño para fútbol latinoamericano
// ============================================================

import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate, useCurrentFrame } from 'remotion';
import data from '../data/partido-video.json';

// Tipos
interface VideoData {
  competencia: string;
  fecha: string;
  equipoA: string;
  equipoB: string;
  marcadorA: number;
  marcadorB: number;
  estadio: string;
  titular: string;
  resumen: string;
  gancho: string;
  posesionA: number;
  posesionB: number;
  rematesA: number;
  rematesB: number;
  aPuertaA: number;
  aPuertaB: number;
  cornersA: number;
  cornersB: number;
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
    fontSize: 24,
    fontWeight: 'bold' as const,
    letterSpacing: 1,
  },
  date: {
    position: 'absolute' as const,
    top: 30,
    right: 40,
    color: '#8892b0',
    fontSize: 16,
  },
  titular: {
    fontSize: 38,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    textAlign: 'center' as const,
    marginBottom: 15,
    maxWidth: 800,
  },
  teams: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
    marginBottom: 25,
  },
  teamName: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  score: {
    fontSize: 52,
    fontWeight: 'bold' as const,
    color: '#e94560',
  },
  resumen: {
    color: '#ccd6f6',
    fontSize: 24,
    textAlign: 'center' as const,
    maxWidth: 800,
    lineHeight: 1.4,
    marginBottom: 20,
    padding: '0 20px',
  },
  gancho: {
    color: '#e94560',
    fontSize: 28,
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    width: '70%',
    maxWidth: 600,
    marginBottom: 15,
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 5,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  statLabel: { color: '#8892b0', fontSize: 16 },
  statValue: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
};

export const ResumenTactico: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const d = data as VideoData;

  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, 15], [20, 0], { extrapolateRight: 'clamp' });

  const showTitular = frame > 10 && frame < durationInFrames - 30;
  const showResumen = frame > 50 && frame < durationInFrames - 50;
  const showStats = frame > 80 && frame < durationInFrames - 80;
  const showGancho = frame > durationInFrames - 60;

  return (
    <AbsoluteFill style={styles.container}>
      {/* Header */}
      <div style={{ ...styles.header, opacity, transform: `translateY(${translateY}px)` }}>
        {d.competencia}
      </div>
      <div style={{ ...styles.date, opacity, transform: `translateY(${translateY}px)` }}>
        {d.fecha}
      </div>

      {/* TITULAR */}
      {showTitular && (
        <div style={{ ...styles.titular, opacity, transform: `translateY(${translateY}px)` }}>
          {d.titular || `${d.equipoA} ${d.marcadorA}-${d.marcadorB} ${d.equipoB}`}
        </div>
      )}

      {/* EQUIPOS Y MARCADOR */}
      <div style={{ ...styles.teams, opacity, transform: `translateY(${translateY}px)` }}>
        <span style={styles.teamName}>{d.equipoA}</span>
        <span style={styles.score}>{d.marcadorA} - {d.marcadorB}</span>
        <span style={styles.teamName}>{d.equipoB}</span>
      </div>

      {/* RESUMEN */}
      {showResumen && (
        <div style={{ ...styles.resumen, opacity, transform: `translateY(${translateY}px)` }}>
          {d.resumen}
        </div>
      )}

      {/* ESTADÍSTICAS */}
      {showStats && (
        <div style={{ ...styles.statsGrid, opacity, transform: `translateY(${translateY}px)` }}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>⚽ Posesión</span>
            <span style={styles.statValue}>{d.posesionA}% - {d.posesionB}%</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>🎯 Remates</span>
            <span style={styles.statValue}>{d.rematesA} - {d.rematesB}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>📐 A puerta</span>
            <span style={styles.statValue}>{d.aPuertaA} - {d.aPuertaB}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>🔄 Córners</span>
            <span style={styles.statValue}>{d.cornersA} - {d.cornersB}</span>
          </div>
        </div>
      )}

      {/* GANCHO FINAL */}
      {showGancho && (
        <div style={{ ...styles.gancho, opacity, transform: `translateY(${translateY}px)` }}>
          {d.gancho}
        </div>
      )}

      <div style={styles.footer}>🎬 ProntoSport • Generado con IA</div>
    </AbsoluteFill>
  );
};
