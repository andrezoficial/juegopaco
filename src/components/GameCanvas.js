import React from 'react';
import { PauseScreen } from './PauseScreen';

export function GameCanvas({ canvasRef, canvasSize, isMobile, score, level, levelName, gameState, onTogglePause, onRestart }) {
  const isPaused = gameState === 'paused';

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          border: '3px solid #333',
          borderRadius: '10px',
          background: 'white',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          maxWidth: '100%',
          height: 'auto',
          touchAction: 'none',
        }}
      />

      {isPaused && (
        <PauseScreen
          isMobile={isMobile}
          score={score}
          onResume={onTogglePause}
          onRestart={onRestart}
        />
      )}

      <div
        style={{
          marginTop: isMobile ? '10px' : '15px',
          color: 'white',
          fontSize: isMobile ? '12px' : '16px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          background: 'rgba(255,255,255,0.2)',
          padding: isMobile ? '8px 15px' : '10px 20px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          textAlign: 'center',
          maxWidth: '90vw',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span>
          {isMobile
            ? '✨ Doble toque para saltar | Desliza para mover ✨'
            : '⬅️ ➡️ Mover | ⬆️ Saltar | P Pausa'}
        </span>
        {!isMobile && (
          <button
            onClick={onTogglePause}
            title="Pausar (P / Esc)"
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {isPaused ? '▶️' : '⏸'}
          </button>
        )}
        <span style={{ color: '#a0e8ff', fontWeight: 'bold', fontSize: isMobile ? '10px' : '14px' }}>
          ⭐ Nivel {level} · {levelName}
        </span>
      </div>
    </div>
  );
}
