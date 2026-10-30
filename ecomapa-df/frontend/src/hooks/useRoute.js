import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// req = { pointId, mode } | null. Só calcula quando a origem (userPos) é conhecida.
export function useRoute(req, userPos) {
  const [state, setState] = useState({ data: null, loading: false, error: null });
  const lat = userPos?.lat;
  const lng = userPos?.lng;
  const pointId = req?.pointId;
  const mode = req?.mode;

  useEffect(() => {
    if (!pointId || lat == null) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const ctrl = new AbortController();
    setState({ data: null, loading: true, error: null });
    api.get('/route', { pointId, fromLat: lat, fromLng: lng, mode }, ctrl.signal)
      .then((r) => setState({ data: r.data, loading: false, error: null }))
      .catch((e) => { if (e.name !== 'AbortError') setState({ data: null, loading: false, error: e.message }); });
    return () => ctrl.abort();
  }, [pointId, mode, lat, lng]);

  return state;
}
