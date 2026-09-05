import React from 'react';

export function Header({ isMobile, pacoImageLoaded }) {
  const logoStyle = {
    width: isMobile ? '40px' : '60px',
    height: isMobile ? '40px' : '60px',
    objectFit: 'contain',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '10px' : '20px',
        margin: isMobile ? '5px 0 10px 0' : '0 0 20px 0',
        zIndex: 10,
      }}
    >
      {pacoImageLoaded && <img src="/paco.png" alt="Paco" style={logoStyle} />}

      <h1
        style={{
          color: 'white',
          fontSize: isMobile ? '20px' : '36px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          textAlign: 'center',
          padding: '0 10px',
          margin: 0,
        }}
      >
        {pacoImageLoaded ? 'PACO EN LA CIUDAD' : '🐱 PACO EN LA CIUDAD'} 🎮
      </h1>

      {pacoImageLoaded && <img src="/paco.png" alt="Paco" style={logoStyle} />}
    </div>
  );
}
