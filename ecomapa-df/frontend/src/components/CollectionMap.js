'use client';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { DF_CENTER, DF_ZOOM, TILE_URL, TILE_ATTRIBUTION, TILE_DARK_FILTER } from '@/lib/constants';
import { pinKind } from '@/lib/geo';


function pinIcon(L, point, selected) {
  return L.divIcon({
    className: 'eco-pin-wrap',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div class="eco-pin eco-pin--${pinKind(point.materials)} ${selected ? 'is-selected' : ''}"><span class="eco-pin__pulse"></span><span class="eco-pin__core"></span></div>`
  });
}

export default function CollectionMap({ points, selectedId, onSelect, userPos, focus, route }) {
  const el = useRef(null);
  const ctx = useRef(null);
  const prevSelected = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  onSelectRef.current = onSelect;

  // Inicialização (Leaflet só existe no navegador).
  useEffect(() => {
    let cancelled = false;
    let observer;
    (async () => {
      const L = (await import('leaflet')).default;
      window.L = L; // exigido pelo markercluster
      await import('leaflet.markercluster');
      if (cancelled || !el.current) return;

      const map = L.map(el.current, { zoomControl: false, center: DF_CENTER, zoom: DF_ZOOM, minZoom: 8, maxZoom: 19 });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

      const cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 55,
        iconCreateFunction: (c) =>
          L.divIcon({ className: 'eco-cluster-wrap', iconSize: [46, 46], html: `<div class="eco-cluster"><span>${c.getChildCount()}</span></div>` })
      });
      map.addLayer(cluster);
      map.on('click', () => onSelectRef.current(null));

      ctx.current = { L, map, cluster, markers: new Map(), user: null };
      observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(el.current);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
      ctx.current?.map.remove();
      ctx.current = null;
      setReady(false);
    };
  }, []);

  // Marcadores + enquadramento.
  useEffect(() => {
    if (!ready) return;
    const { L, map, cluster, markers } = ctx.current;
    cluster.clearLayers();
    markers.clear();
    prevSelected.current = null;

    const layers = points.map((p) => {
      const m = L.marker([p.latitude, p.longitude], { icon: pinIcon(L, p, false), title: p.name, alt: p.name, riseOnHover: true });
      m.on('click', (e) => { L.DomEvent.stopPropagation(e); onSelectRef.current(p.id); });
      markers.set(p.id, { marker: m, point: p });
      return m;
    });
    cluster.addLayers(layers);

    const coords = points.map((p) => [p.latitude, p.longitude]);
    if (userPos) coords.push([userPos.lat, userPos.lng]);
    if (coords.length) map.flyToBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 15, duration: 0.8 });
  }, [ready, points, userPos]);

  // Região sem pontos: centraliza se houver coordenadas cadastradas.
  useEffect(() => {
    if (!ready || !focus) return;
    ctx.current.map.flyTo([focus.lat, focus.lng], 13, { duration: 0.9 });
  }, [ready, focus]);

  // Seleção.
  useEffect(() => {
    if (!ready) return;
    const { L, map, cluster, markers } = ctx.current;
    const prev = markers.get(prevSelected.current);
    if (prev) prev.marker.setIcon(pinIcon(L, prev.point, false));
    const cur = markers.get(selectedId);
    if (cur) {
      cur.marker.setIcon(pinIcon(L, cur.point, true));
      cluster.zoomToShowLayer(cur.marker, () => map.panTo(cur.marker.getLatLng(), { animate: true }));
    }
    prevSelected.current = selectedId;
  }, [ready, selectedId]);

  // Posição do usuário.
  useEffect(() => {
    if (!ready) return;
    const c = ctx.current;
    c.user?.remove();
    c.user = null;
    if (userPos) {
      c.user = c.L.marker([userPos.lat, userPos.lng], {
        icon: c.L.divIcon({ className: 'eco-pin-wrap', iconSize: [20, 20], html: '<div class="eco-user"></div>' }),
        interactive: false,
        zIndexOffset: 1000
      }).addTo(c.map);
    }
  }, [ready, userPos]);

  // Rota desenhada (brilho + linha animada).
  useEffect(() => {
    if (!ready) return;
    const c = ctx.current;
    c.routeLayer?.remove();
    c.routeLayer = null;
    if (!route || route.length < 2) return;
    const glow = c.L.polyline(route, { color: '#00D9FF', weight: 12, opacity: 0.22, interactive: false, lineCap: 'round' });
    const line = c.L.polyline(route, { color: '#00D9FF', weight: 4, opacity: 0.95, className: 'eco-route-flow', interactive: false, lineCap: 'round', lineJoin: 'round' });
    c.routeLayer = c.L.layerGroup([glow, line]).addTo(c.map);
    c.map.flyToBounds(c.L.latLngBounds(route), { paddingTopLeft: [60, 90], paddingBottomRight: [60, 260], maxZoom: 16, duration: 0.8 });
  }, [ready, route]);

  return <div ref={el} className={`eco-map ${TILE_DARK_FILTER ? 'eco-map--dark' : ''}`} role="application" aria-label="Mapa interativo de pontos de coleta" />;
}
