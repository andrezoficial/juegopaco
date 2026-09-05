import React from 'react';

export function GameOverScreen({ score, highScore, level, levelName, highestLevel, isMobile, onRestart }) {
  const isNewLevelRecord = level >= highestLevel && level > 1;
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: isMobile ? '20px' : '40px',
        borderRadius: '15px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        maxWidth: '90vw',
        width: isMobile ? '280px' : '400px',
      }}
    >
      <h2 style={{ fontSize: isMobile ? '20px' : '32px', color: '#333', margin: '0 0 15px 0' }}>😿 Game Over</h2>
      <p style={{ fontSize: isMobile ? '16px' : '24px', color: '#667eea', fontWeight: 'bold', margin: '10px 0' }}>
        Puntos: {score}
      </p>
      <p style={{ fontSize: isMobile ? '14px' : '18px', color: '#888', margin: '5px 0' }}>Récord: {highScore}</p>
      <p style={{ fontSize: isMobile ? '13px' : '16px', color: '#555', margin: '5px 0' }}>
        Llegaste al nivel {level} <span style={{ color: '#888' }}>({levelName})</span>
      </p>
      <p style={{ fontSize: isMobile ? '12px' : '14px', color: '#888', margin: '0 0 5px 0' }}>
        Nivel máximo alcanzado: {highestLevel}
      </p>
      {isNewLevelRecord && (
        <p style={{ fontSize: isMobile ? '12px' : '16px', color: '#ff6b6b', fontWeight: 'bold', margin: '10px 0' }}>
          ¡Nuevo nivel máximo! 🌟
        </p>
      )}
      {score === highScore && score > 0 && (
        <p style={{ fontSize: isMobile ? '12px' : '15px', color: '#667eea', fontWeight: 'bold', margin: '8px 0' }}>
          🏆 ¡Nuevo récord!
        </p>
      )}

      <button
        onClick={onRestart}
        style={{
          marginTop: '20px',
          padding: isMobile ? '10px 25px' : '12px 30px',
          fontSize: isMobile ? '14px' : '18px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '25px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          width: '100%',
          maxWidth: isMobile ? '200px' : '250px',
        }}
      >
        🎮 Jugar de Nuevo
      </button>
    </div>
  );
}
