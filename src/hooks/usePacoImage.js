import { useEffect, useState } from 'react';

export function usePacoImage() {
  const [pacoImageLoaded, setPacoImageLoaded] = useState(false);

  useEffect(() => {
    const pacoImage = new Image();
    pacoImage.onload = () => setPacoImageLoaded(true);
    pacoImage.onerror = () => setPacoImageLoaded(false);
    pacoImage.src = '/paco.png';
  }, []);

  return pacoImageLoaded;
}
