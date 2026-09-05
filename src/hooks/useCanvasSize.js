import { useCallback, useEffect, useRef, useState } from 'react';
import { CANVAS_BASE, PLAYER_BASE } from '../game/constants';

const isMobileDevice = () =>
  typeof navigator !== 'undefined' ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) : false;

/**
 * Calcula el tamaño de canvas según el contenedor y el dispositivo, y
 * reposiciona/escala al jugador (playerRef) cada vez que cambia el tamaño.
 */
export function useCanvasSize(playerRef) {
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(CANVAS_BASE);
  const isMobile = isMobileDevice();

  const updateCanvasSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    let nextSize;
    if (isMobile) {
      const maxWidth = Math.min(600, containerWidth - 10);
      const aspectRatio = 16 / 9;
      const height = Math.min(maxWidth / aspectRatio, containerHeight * 0.8);
      nextSize = { width: maxWidth, height };

      const scaleFactor = maxWidth / CANVAS_BASE.width;
      playerRef.current = {
        ...playerRef.current,
        x: PLAYER_BASE.x * scaleFactor,
        y: height - 60,
        width: PLAYER_BASE.width * scaleFactor,
        height: PLAYER_BASE.height * (height / CANVAS_BASE.height),
      };
    } else {
      const maxWidth = Math.min(800, containerWidth - 40);
      const height = Math.min(400, maxWidth * 0.5);
      nextSize = { width: maxWidth, height };

      const scaleFactor = maxWidth / CANVAS_BASE.width;
      playerRef.current = {
        ...playerRef.current,
        x: PLAYER_BASE.x * scaleFactor,
        y: (PLAYER_BASE.y * height) / CANVAS_BASE.height,
        width: PLAYER_BASE.width * scaleFactor,
        height: PLAYER_BASE.height * (height / CANVAS_BASE.height),
      };
    }

    setCanvasSize(nextSize);
  }, [isMobile, playerRef]);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  return { containerRef, canvasSize, isMobile, updateCanvasSize };
}
