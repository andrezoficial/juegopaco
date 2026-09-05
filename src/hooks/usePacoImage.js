import { useEffect, useRef, useState } from 'react';

// Precarga el sprite de Paco y expone tanto el elemento <img> ya cargado
// (para dibujarlo con ctx.drawImage) como un booleano de conveniencia.
export function usePacoImage() {
  const [pacoImageLoaded, setPacoImageLoaded] = useState(false);
  const pacoImageRef = useRef(null);

  useEffect(() => {
    const pacoImage = new Image();
    pacoImage.onload = () => {
      pacoImageRef.current = pacoImage;
      setPacoImageLoaded(true);
    };
    pacoImage.onerror = () => {
      pacoImageRef.current = null;
      setPacoImageLoaded(false);
    };
    pacoImage.src = '/paco.png';
  }, []);

  return { pacoImageLoaded, pacoImageRef };
}
