'use client';
import { useEffect, useRef, useState } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { DF_CENTER, DF_ZOOM } from '@/lib/constants';
import { pinKind } from '@/lib/geo';
import { loadGoogleMaps, GOOGLE_KEY, GOOGLE_MAP_ID } from '@/lib/googleMaps';

// Marcadores são HTML (neon pulsante). O ponto de ancoragem do Google é o centro inferior,
// então deslocamos o elemento 50% para o círculo ficar centrado na coordenada.
function pinElement(point) {
  const el = document.createElement('div');
  el.className = `eco-pin eco-pin--${pinKind(point.materials)}`;
  el.style.transform = 'translateY(50%)';
  el.innerHTML = '<span class="eco-pin__pulse"></span><span class="eco-pin__core"></span>';
  return el;
}

const toLatLng = (p) => ({ lat: p.latitude, lng: p.longitude });

export default function CollectionMap({ points, selectedId, onSelect, userPos, focus, route }) {
  const el = useRef(null);
  const ctx = useRef(null);
  const prevSelected = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(GOOGLE_KEY ? null : 'NO_KEY');
  onSelectRef.current = onSelect;

  // Inicialização.
  useEffect(() => {
    if (!GOOGLE_KEY) return undefined;
    let cancelled = false;
    window.gm_authFailure = () => setError('AUTH'); // chave recusada pelo Google

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !el.current) return;
        const g = window.google.maps;
        const map = new g.Map(el.current, {
          center: { lat: DF_CENTER[0], lng: DF_CENTER[1] },
          zoom: DF_ZOOM,
          minZoom: 8,
          mapId: GOOGLE_MAP_ID,
          colorScheme: g.ColorScheme?.DARK ?? 'DARK',
          backgroundColor: '#07111F',
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false
        });
        map.addListener('click', () => onSelectRef.current(null));

        const cluster = new MarkerClusterer({
          map,
          markers: [],
          renderer: {
            render: ({ count, position }) => {
              const c = document.createElement('div');
              c.className = 'eco-cluster';
              c.style.transform = 'translateY(50%)';
              c.innerHTML = `<span>${count}</span>`;
              return new g.marker.AdvancedMarkerElement({ position, content: c, zIndex: 1000 + count });
            }
          }
        });

        ctx.current = { g, map, cluster, markers: new Map(), user: null, routeLines: [] };
        setReady(true);
      })
      .catch((e) => { if (!cancelled) setError(e.message === 'NO_KEY' ? 'NO_KEY' : 'LOAD'); });

    return () => {
      cancelled = true;
      const c = ctx.current;
      if (c) {
        c.cluster.clearMarkers();
        c.routeLines.forEach((l) => l.setMap(null));
        c.user && (c.user.map = null);
        c.g.event.clearInstanceListeners(c.map);
      }
      ctx.current = null;
      setReady(false);
    };
  }, []);

  // Marcadores + enquadramento.
  useEffect(() => {
    if (!ready) return;
    const { g, map, cluster, markers } = ctx.current;
    cluster.clearMarkers();
    markers.clear();
    prevSelected.current = null;

    const list = points.map((p) => {
      const content = pinElement(p);
      const marker = new g.marker.AdvancedMarkerElement({ position: toLatLng(p), content, title: p.name, gmpClickable: true });
      marker.addEventListener('gmp-click', () => onSelectRef.current(p.id));
      markers.set(p.id, { marker, el: content, point: p });
      return marker;
    });
    cluster.addMarkers(list);

    const bounds = new g.LatLngBounds();
    points.forEach((p) => bounds.extend(toLatLng(p)));
    if (userPos) bounds.extend({ lat: userPos.lat, lng: userPos.lng });
    if (!bounds.isEmpty()) {
      if (points.length + (userPos ? 1 : 0) === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, 60);
        g.event.addListenerOnce(map, 'idle', () => { if (map.getZoom() > 16) map.setZoom(16); });
      }
    }
  }, [ready, points, userPos]);

  // Região sem pontos: centraliza se houver coordenadas cadastradas.
  useEffect(() => {
    if (!ready || !focus) return;
    const { map } = ctx.current;
    map.panTo({ lat: focus.lat, lng: focus.lng });
    map.setZoom(13);
  }, [ready, focus]);

  // Seleção.
  useEffect(() => {
    if (!ready) return;
    const { map, markers } = ctx.current;
    markers.get(prevSelected.current)?.el.classList.remove('is-selected');
    const cur = markers.get(selectedId);
    if (cur) {
      cur.el.classList.add('is-selected');
      map.panTo(toLatLng(cur.point));
      if ((map.getZoom() ?? 0) < 14) map.setZoom(14);
    }
    prevSelected.current = selectedId;
  }, [ready, selectedId]);

  // Posição do usuário.
  useEffect(() => {
    if (!ready) return;
    const c = ctx.current;
    if (c.user) { c.user.map = null; c.user = null; }
    if (userPos) {
      const dot = document.createElement('div');
      dot.className = 'eco-user';
      dot.style.transform = 'translateY(50%)';
      c.user = new c.g.marker.AdvancedMarkerElement({ map: c.map, position: { lat: userPos.lat, lng: userPos.lng }, content: dot, zIndex: 2000 });
    }
  }, [ready, userPos]);

  // Rota desenhada (brilho + linha). O trajeto vem do nosso servidor de rotas.
  useEffect(() => {
    if (!ready) return;
    const c = ctx.current;
    c.routeLines.forEach((l) => l.setMap(null));
    c.routeLines = [];
    if (!route || route.length < 2) return;
    const path = route.map(([lat, lng]) => ({ lat, lng }));
    const base = { path, map: c.map, clickable: false, strokeColor: '#00D9FF' };
    c.routeLines = [
      new c.g.Polyline({ ...base, strokeOpacity: 0.25, strokeWeight: 12, zIndex: 1 }),
      new c.g.Polyline({ ...base, strokeOpacity: 0.95, strokeWeight: 4, zIndex: 2 })
    ];
    const bounds = new c.g.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    c.map.fitBounds(bounds, { top: 90, left: 60, right: 60, bottom: 260 });
  }, [ready, route]);

  return (
    <>
      <div ref={el} className="eco-map" role="application" aria-label="Mapa interativo de pontos de coleta" />
      {error && (
        <div className="eco-map-fallback" role="alert">
          {error === 'NO_KEY' && (
            <>
              <strong>Chave do Google Maps não configurada</strong>
              <span>Defina <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> em <code>frontend/.env.local</code> e reinicie o <code>npm run dev</code>.</span>
            </>
          )}
          {error === 'AUTH' && (
            <>
              <strong>O Google recusou a chave</strong>
              <span>Confira no Google Cloud: cobrança ativa, “Maps JavaScript API” habilitada e o endereço deste site liberado na restrição da chave.</span>
            </>
          )}
          {error === 'LOAD' && (
            <>
              <strong>Não foi possível carregar o Google Maps</strong>
              <span>Verifique sua conexão e a chave, e recarregue a página.</span>
            </>
          )}
        </div>
      )}
    </>
  );
}
