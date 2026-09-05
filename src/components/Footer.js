import React from 'react';

export function Footer({ isMobile }) {
  return (
    <footer
      style={{
        marginTop: isMobile ? '10px' : '20px',
        color: 'white',
        textAlign: 'center',
        fontSize: isMobile ? '10px' : '14px',
        opacity: 0.8,
        padding: '10px',
        width: '100%',
      }}
    >
      <p style={{ margin: '5px 0' }}>
        Desarrollado por{' '}
        <a
          href="https://github.com/AndrezOficial"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#ffeb3b', textDecoration: 'none', fontWeight: 'bold' }}
        >
          AndrezOficial
        </a>
      </p>
      <p style={{ margin: '5px 0', fontSize: isMobile ? '9px' : '13px' }}>
        {isMobile ? 'Doble toque para saltar • Desliza para mover' : '¡Agarra la comida antes de que desaparezca! 🐟🥛'}
      </p>
    </footer>
  );
}
