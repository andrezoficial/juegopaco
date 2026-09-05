import React from 'react';

// Captura errores de renderizado en cualquier parte del árbol de componentes
// (incluido el game loop si lanza durante un render) y muestra una pantalla
// de recuperación en vez de dejar la app en blanco.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Punto único para conectar telemetría/logging en el futuro
    // (p. ej. enviar a un servicio de error tracking).
    console.error('Paco en la Ciudad — error no controlado:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center',
            padding: '20px',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '28px' }}>😿 Algo salió mal</h1>
          <p style={{ margin: 0, opacity: 0.85, maxWidth: '360px' }}>
            Paco tropezó con un error inesperado. Intenta reiniciar el juego.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: '#ffeb3b',
              color: '#333',
            }}
          >
            Reiniciar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
