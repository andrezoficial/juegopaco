import { useCallback, useEffect, useRef } from 'react';
import { MUSIC } from '../game/constants';

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
 * Sintetiza efectos de sonido, música de fondo y ambiente con Web Audio API
 * (sin archivos de audio externos). Todo se apaga de golpe si `setMuted(true)`.
 */
export function useAudio() {
  const audioContextRef = useRef(null);
  const soundBuffersRef = useRef({});
  const mutedRef = useRef(false);

  const musicStateRef = useRef({ schedulerId: null, nextNoteTime: 0, noteIndex: 0, intensity: 0 });
  const ambientNodesRef = useRef([]);
  const ambientTimerRef = useRef(null);
  const ambientThemeRef = useRef(null);
  const rainNodeRef = useRef(null);

  const initAudio = useCallback(async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

      const createSound = ({ frequency, duration, type }) => () => {
        const audioContext = audioContextRef.current;
        if (!audioContext || mutedRef.current) return;

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

  // Los navegadores exigen un gesto del usuario para arrancar el audio;
  // llamar esto dentro de un click handler (ej. "Jugar") lo desbloquea.
  const resumeAudio = useCallback(() => {
    const ctx = audioContextRef.current;
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }, []);

  // --- Música de fondo ---
  const playMusicNote = useCallback((freq, time, duration) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(MUSIC.noteGain, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }, []);

  const stopMusic = useCallback(() => {
    if (musicStateRef.current.schedulerId) {
      clearTimeout(musicStateRef.current.schedulerId);
      musicStateRef.current.schedulerId = null;
    }
  }, []);

  const startMusic = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    stopMusic();
    if (mutedRef.current) return;

    musicStateRef.current.noteIndex = 0;
    musicStateRef.current.nextNoteTime = ctx.currentTime + 0.05;

    const scheduler = () => {
      const state = musicStateRef.current;
      const ctxNow = audioContextRef.current;
      if (!ctxNow) return;
      const [minBpm, maxBpm] = MUSIC.bpmRange;
      const bpm = minBpm + state.intensity * (maxBpm - minBpm);
      const secondsPerBeat = 60 / bpm;

      while (state.nextNoteTime < ctxNow.currentTime + 0.15) {
        if (!mutedRef.current) {
          const semitone = MUSIC.pattern[state.noteIndex % MUSIC.pattern.length];
          const freq = MUSIC.baseFreq * Math.pow(2, semitone / 12) * (1 + state.intensity * 0.15);
          playMusicNote(freq, state.nextNoteTime, secondsPerBeat * 0.85);
        }
        state.nextNoteTime += secondsPerBeat;
        state.noteIndex += 1;
      }
      musicStateRef.current.schedulerId = setTimeout(scheduler, 100);
    };
    scheduler();
  }, [playMusicNote, stopMusic]);

  // intensity: 0 (calmo) a 1 (máxima dificultad) -> sube tempo y tono.
  const setMusicIntensity = useCallback((intensity) => {
    musicStateRef.current.intensity = Math.max(0, Math.min(1, intensity));
  }, []);

  // --- Sonido ambiente por tema (día vs. noche) ---
  const stopAmbient = useCallback(() => {
    ambientNodesRef.current.forEach((node) => {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch (e) {
        /* nodo ya detenido */
      }
    });
    ambientNodesRef.current = [];
    clearTimeout(ambientTimerRef.current);
    ambientTimerRef.current = null;
    ambientThemeRef.current = null;
  }, []);

  const setAmbientTheme = useCallback(
    (theme) => {
      if (ambientThemeRef.current === theme) return;
      const ctx = audioContextRef.current;
      stopAmbient();
      ambientThemeRef.current = theme;
      if (!ctx || mutedRef.current) return;

      // Colchón continuo y suave (acorde grave y oscuro de noche, más abierto y
      // brillante de día).
      const droneFreqs = theme === 'day' ? [220, 330] : [110, 164.81];
      droneFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.018, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        ambientNodesRef.current.push(osc);
      });

      // Detalle periódico: pajaritos de día, grillos de noche.
      const scheduleDetail = () => {
        const ctxNow = audioContextRef.current;
        if (ctxNow && !mutedRef.current && ambientThemeRef.current === theme) {
          if (theme === 'day') {
            [0, 0.12].forEach((offset) => {
              const osc = ctxNow.createOscillator();
              const gain = ctxNow.createGain();
              const freq = 1800 + Math.random() * 600;
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, ctxNow.currentTime + offset);
              osc.frequency.exponentialRampToValueAtTime(freq * 0.7, ctxNow.currentTime + offset + 0.08);
              gain.gain.setValueAtTime(0.05, ctxNow.currentTime + offset);
              gain.gain.exponentialRampToValueAtTime(0.001, ctxNow.currentTime + offset + 0.1);
              osc.connect(gain);
              gain.connect(ctxNow.destination);
              osc.start(ctxNow.currentTime + offset);
              osc.stop(ctxNow.currentTime + offset + 0.15);
            });
          } else {
            const osc = ctxNow.createOscillator();
            const gain = ctxNow.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(4200, ctxNow.currentTime);
            gain.gain.setValueAtTime(0.013, ctxNow.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctxNow.currentTime + 0.06);
            osc.connect(gain);
            gain.connect(ctxNow.destination);
            osc.start();
            osc.stop(ctxNow.currentTime + 0.07);
          }
        }
        const nextDelay = theme === 'day' ? 2200 + Math.random() * 2200 : 800 + Math.random() * 900;
        ambientTimerRef.current = setTimeout(scheduleDetail, nextDelay);
      };
      scheduleDetail();
    },
    [stopAmbient]
  );

  // --- Clima ---
  const startRain = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || mutedRef.current || rainNodeRef.current) return;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3200;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    rainNodeRef.current = noise;
  }, []);

  const stopRain = useCallback(() => {
    if (rainNodeRef.current) {
      try {
        rainNodeRef.current.stop();
      } catch (e) {
        /* ya detenido */
      }
      rainNodeRef.current = null;
    }
  }, []);

  const playWindGust = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || mutedRef.current) return;
    const bufferSize = Math.floor(ctx.sampleRate * 1.2);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.5);
    filter.frequency.linearRampToValueAtTime(300, ctx.currentTime + 1.1);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 1.3);
  }, []);

  // --- Silencio general ---
  const setMuted = useCallback(
    (value) => {
      mutedRef.current = value;
      if (value) {
        stopMusic();
        stopAmbient();
        stopRain();
      }
    },
    [stopMusic, stopAmbient, stopRain]
  );

  const isMuted = useCallback(() => mutedRef.current, []);

  useEffect(() => {
    initAudio();
    return () => {
      stopMusic();
      stopAmbient();
      stopRain();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initAudio]);

  return {
    playSound,
    resumeAudio,
    startMusic,
    stopMusic,
    setMusicIntensity,
    setAmbientTheme,
    startRain,
    stopRain,
    playWindGust,
    setMuted,
    isMuted,
  };
}
