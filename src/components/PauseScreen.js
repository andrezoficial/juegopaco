import React from 'react';

export function PauseScreen({ isMobile, score, onResume, onRestart }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.97)',
          padding: isMobile ? '20px' : '36px 48px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          pointerEvents: 'all',
        }}
      >
        <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: '6px' }}>⏸</div>
        <h2 style={{ fontSize: isMobile ? '20px' : '28px', color: '#333', margin: '0 0 8px 0' }}>Pausa</h2>
        <p style={{ color: '#888', fontSize: isMobile ? '13px' : '15px', margin: '0 0 20px 0' }}>
          Puntos actuales: <strong style={{ color: '#667eea' }}>{score}</strong>
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
          <button
            onClick={onResume}
            style={{
              padding: isMobile ? '10px 24px' : '12px 32px',
              fontSize: isMobile ? '14px' : '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            ▶️ Continuar
          </button>
          <button
            onClick={onRestart}
            style={{
              padding: isMobile ? '10px 24px' : '12px 32px',
              fontSize: isMobile ? '14px' : '16px',
              background: '#f0f0f0',
              color: '#555',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🔄 Reiniciar
          </button>
        </div>

        {!isMobile && (
          <p style={{ color: '#bbb', fontSize: '13px', marginTop: '16px', marginBottom: 0 }}>
            Presiona P o Esc para continuar
          </p>
        )}
      </div>
    </div>
  );
}
