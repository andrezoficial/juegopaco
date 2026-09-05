import { useEffect, useRef } from 'react';

const CONTROL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Escape', 'p', 'P'];

/**
 * Mantiene un ref con las teclas presionadas actualmente. Se desactiva en móvil,
 * donde los controles táctiles toman el relevo.
 */
export function useKeyboardControls(isMobile) {
  const keysRef = useRef({});

  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e) => {
      if (CONTROL_KEYS.includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key] = true;
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMobile]);

  return keysRef;
}
