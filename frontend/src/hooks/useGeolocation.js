import { useCallback, useState } from 'react';

const MESSAGES = {
  1: 'Permissão de localização negada. Você ainda pode pesquisar por região ou cidade.',
  2: 'Não foi possível determinar sua localização agora.',
  3: 'Tempo esgotado ao obter a localização. Tente novamente.'
};

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const locate = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          const msg = 'Seu navegador não oferece geolocalização.';
          setError(msg);
          return reject(new Error(msg));
        }
        setLoading(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLoading(false);
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          (err) => {
            setLoading(false);
            const msg = MESSAGES[err.code] || MESSAGES[2];
            setError(msg);
            reject(new Error(msg));
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
        );
      }),
    []
  );

  return { locate, loading, error, clearError: () => setError(null) };
}
