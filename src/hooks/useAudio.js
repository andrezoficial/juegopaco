import { useCallback, useEffect, useRef } from 'react';

const SOUND_DEFINITIONS = {
  collect: { frequency: 800, duration: 0.1, type: 'sine' },
  collectCombo: { frequency: 1200, duration: 0.2, type: 'sine' },
  hit: { frequency: 200, duration: 0.3, type: 'sawtooth' },
  jump: { frequency: 400, duration: 0.1, type: 'triangle' },
  powerUp: { frequency: 600, duration: 0.5, type: 'square' },
  gameOver: { frequency: 150, duration: 1.0, type: 'sawtooth' },
  levelUp: { frequency: 1000, duration: 0.35, type: 'triangle' },
  extraLife: { frequency: 1400, duration: 0.4, type: 'sine' },
};

/**
 * Sintetiza efectos de sonido con Web Audio API (sin archivos de audio externos).
 * Devuelve `playSound(name)` para disparar cualquier efecto definido arriba.
 */
export function useAudio() {
  const audioContextRef = useRef(null);
  const soundBuffersRef = useRef({});

  const initAudio = useCallback(async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

      const createSound = ({ frequency, duration, type }) => () => {
        const audioContext = audioContextRef.current;
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
      };

      const buffers = {};
      Object.entries(SOUND_DEFINITIONS).forEach(([name, config]) => {
        buffers[name] = createSound(config);
      });
      soundBuffersRef.current = buffers;
    } catch (error) {
      console.log('Audio no disponible');
    }
  }, []);

  const playSound = useCallback((soundName) => {
    soundBuffersRef.current[soundName]?.();
  }, []);

  useEffect(() => {
    initAudio();
  }, [initAudio]);

  return { playSound };
}
