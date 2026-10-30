import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Escolhe o endpoint conforme o contexto: proximidade > busca > listagem.
export function usePoints({ material, region, radiusKm, query, userPos }) {
  const [state, setState] = useState({ points: [], total: 0, originInsideDF: true, loading: true, error: null });
  const lat = userPos?.lat;
  const lng = userPos?.lng;

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        let res;
        if (lat != null) {
          res = await api.get('/collection-points/nearby', { lat, lng, radiusKm, material, limit: 200 }, ctrl.signal);
        } else if (query) {
          res = await api.get('/collection-points/search', { q: query, material, limit: 100 }, ctrl.signal);
        } else {
          res = await api.get('/collection-points', { material, region, limit: 100 }, ctrl.signal);
        }
        let points = res.data;
        // Região combinada com proximidade/busca é filtrada aqui.
        if (region && (lat != null || query)) points = points.filter((p) => p.region?.slug === region);
        setState({
          points,
          total: lat != null || region ? points.length : res.meta?.total ?? points.length,
          originInsideDF: res.meta?.originInsideDF ?? true,
          loading: false,
          error: null
        });
      } catch (e) {
        if (e.name === 'AbortError') return;
        setState((s) => ({ ...s, points: [], total: 0, loading: false, error: e.message }));
      }
    })();

    return () => ctrl.abort();
  }, [material, region, radiusKm, query, lat, lng]);

  return state;
}
