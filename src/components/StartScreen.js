import React from 'react';

export function StartScreen({ isMobile, highScore, highestLevel, onStart }) {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: isMobile ? '24px 20px' : '40px 48px',
        borderRadius: '20px',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
        maxWidth: '90vw',
        width: isMobile ? '300px' : '420px',
      }}
    >
      <div style={{ fontSize: isMobile ? '48px' : '64px', marginBottom: '8px' }}>🐱</div>
      <h2 style={{ fontSize: isMobile ? '22px' : '32px', color: '#333', margin: '0 0 6px 0' }}>
        Paco en la Ciudad
      </h2>
      <p style={{ color: '#888', fontSize: isMobile ? '13px' : '15px', margin: '0 0 20px 0' }}>
        ¡Ayuda a Paco a recolectar comida y esquivar obstáculos!
      </p>

      <div
        style={{
          background: '#f5f5f5',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '20px',
          textAlign: 'left',
        }}
      >
        {isMobile ? (
          <>
            <div style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>
              <strong>📱 Controles táctiles</strong>
            </div>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.7' }}>
              👆 Doble toque → Saltar<br />
              👈 Deslizar → Mover
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '14px', color: '#555', marginBottom: '6px' }}>
              <strong>⌨️ Controles</strong>
            </div>
            <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.7' }}>
              ⬅️ ➡️ Flechas → Mover<br />
              ⬆️ / Espacio → Saltar<br />
              P / Esc → Pausar
            </div>
          </>
        )}
      </div>

      <div
        style={{
          background: '#f5f5f5',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '24px',
          fontSize: isMobile ? '12px' : '14px',
          color: '#666',
          textAlign: 'left',
          lineHeight: '1.7',
        }}
      >
        🐟 Recolecta comida → puntos<br />
        ⚡ Power-ups → habilidades especiales<br />
        💀 3 golpes → game over<br />
        🔗 Combo rápido → multiplicador de puntos<br />
        ⭐ Sube de nivel → más velocidad y una vida extra cada 2 niveles
      </div>

      {(highScore > 0 || highestLevel > 1) && (
        <p style={{ fontSize: isMobile ? '13px' : '16px', color: '#888', margin: '0 0 16px 0' }}>
          🏆 Récord: <strong style={{ color: '#667eea' }}>{highScore}</strong>
          {highestLevel > 1 && (
            <>
              {' '}· ⭐ Nivel máx: <strong style={{ color: '#667eea' }}>{highestLevel}</strong>
            </>
          )}
        </p>
      )}

      <button
        onClick={onStart}
        style={{
          padding: isMobile ? '12px 30px' : '14px 40px',
          fontSize: isMobile ? '16px' : '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '30px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 4px 16px rgba(102,126,234,0.5)',
          transition: 'transform 0.15s ease',
          width: '100%',
        }}
        onMouseEnter={(e) => (e.target.style.transform = 'scale(1.04)')}
        onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
      >
        🎮 ¡Jugar!
      </button>
    </div>
  );
}
