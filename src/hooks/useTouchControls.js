import { useCallback, useEffect, useRef } from 'react';
import { DOUBLE_TAP_THRESHOLD_MS } from '../game/constants';

const TOUCH_MOVE_THROTTLE_MS = 16;

/**
 * Controles táctiles: deslizar mueve al jugador, doble toque hace saltar.
 * Se auto-adjunta/desmonta al canvas cuando `isMobile` es true.
 */
export function useTouchControls({ canvasRef, playerRef, canvasSize, isMobile, playSound, spawnJumpParticles }) {
  const touchStartXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastTouchXRef = useRef(0);
  const lastTouchTimeRef = useRef(0);
  const touchCountRef = useRef(0);
  const lastTouchMoveTime = useRef(0);

  const handleTouchStart = useCallback(
    (e) => {
      e.preventDefault();
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;

      const currentTime = Date.now();
      if (currentTime - lastTouchTimeRef.current < DOUBLE_TAP_THRESHOLD_MS) {
        touchCountRef.current += 1;
        if (touchCountRef.current === 2 && !playerRef.current.isJumping) {
          // Usar la misma escala que el game loop (width/800) para consistencia
          const scale = canvasSize.width / 800;
          playerRef.current.velocityY = -12 * scale;
          playerRef.current.isJumping = true;
          playSound('jump');
          spawnJumpParticles(playerRef.current.x + playerRef.current.width / 2, playerRef.current.y + playerRef.current.height, 5);
          touchCountRef.current = 0;
        }
      } else {
        touchCountRef.current = 1;
      }
      lastTouchTimeRef.current = currentTime;

      touchStartXRef.current = x;
      lastTouchXRef.current = x;
      isDraggingRef.current = true;
    },
    [canvasRef, playerRef, canvasSize.width, playSound, spawnJumpParticles]
  );

  const handleTouchMove = useCallback(
    (e) => {
      e.preventDefault();
      const currentTime = Date.now();
      if (currentTime - lastTouchMoveTime.current < TOUCH_MOVE_THROTTLE_MS) return;
      lastTouchMoveTime.current = currentTime;

      if (!isDraggingRef.current || e.touches.length > 1) return;

      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;

      const deltaX = x - lastTouchXRef.current;
      lastTouchXRef.current = x;

      if (Math.abs(deltaX) > 1) {
        const player = playerRef.current;
        const scaleFactor = canvasSize.width / 800;
        const moveSpeed = 10 * scaleFactor;

        if (deltaX > 0 && player.x < canvasSize.width - player.width) {
          player.x += moveSpeed;
          player.isMoving = true;
        } else if (deltaX < 0 && player.x > 0) {
          player.x -= moveSpeed;
          player.isMoving = true;
        }
      }
    },
    [canvasRef, playerRef, canvasSize.width]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      e.preventDefault();
      isDraggingRef.current = false;
      playerRef.current.isMoving = false;
    },
    [playerRef]
  );

  const handleTouchCancel = handleTouchEnd;

  useEffect(() => {
    if (!isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e) => e.preventDefault();

    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('gesturechange', preventDefault);
    document.addEventListener('gestureend', preventDefault);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('gesturechange', preventDefault);
      document.removeEventListener('gestureend', preventDefault);

      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isMobile, canvasRef, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);
}
