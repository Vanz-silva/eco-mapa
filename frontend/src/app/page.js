'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import MapSection from '@/components/MapSection';
import SuggestForm from '@/components/SuggestForm';
import AboutContact from '@/components/AboutContact';
import { loadCatalogs } from '@/lib/api';
import { usePoints } from '@/hooks/usePoints';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function Home() {
  const [material, setMaterial] = useState('');
  const [region, setRegion] = useState('');
  const [radiusKm, setRadiusKm] = useState('');
  const [query, setQuery] = useState('');
  const [userPos, setUserPos] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [regions, setRegions] = useState([]);

  const geo = useGeolocation();
  const data = usePoints({ material, region, radiusKm, query, userPos });
  const selected = useMemo(() => data.points.find((p) => p.id === selectedId) || null, [data.points, selectedId]);

  useEffect(() => { loadCatalogs().then((c) => setRegions(c.regions)).catch(() => {}); }, []);
  useEffect(() => { if (selectedId && !data.loading && !selected) setSelectedId(null); }, [selectedId, selected, data.loading]);

  const goToMap = () => document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth' });

  const locate = useCallback(async () => {
    try {
      const pos = await geo.locate();
      setQuery('');
      setSelectedId(null);
      setUserPos(pos);
      goToMap();
    } catch { goToMap(); }
  }, [geo]);

  const submitSearch = (q) => { setQuery(q); setUserPos(null); setRadiusKm(''); setSelectedId(null); if (q) { setRegion(''); goToMap(); } };
  const pickRegion = (r) => { setQuery(''); setUserPos(null); setRadiusKm(''); setRegion(r.slug); setSelectedId(null); goToMap(); };
  const pickPoint = (id) => { setSelectedId(id); goToMap(); };
  const reset = () => { setMaterial(''); setRegion(''); setRadiusKm(''); setQuery(''); setUserPos(null); setSelectedId(null); geo.clearError(); };

  const regionObj = regions.find((r) => r.slug === region);
  const focus = regionObj?.latitude != null && !data.loading && !data.points.length ? { lat: regionObj.latitude, lng: regionObj.longitude } : null;

  let emptyMessage = 'Nenhum ponto de coleta cadastrado ainda.';
  if (query) emptyMessage = `Não encontramos pontos para “${query}”. Ainda não há locais cadastrados nessa busca. Que tal indicar um?`;
  else if (regionObj) emptyMessage = `Ainda não há pontos verificados em ${regionObj.name}${material ? ' para o material selecionado' : ''}. Você pode indicar um.`;
  else if (userPos) emptyMessage = 'Nenhum ponto encontrado nessa distância. Tente ampliar o raio.';

  const notice = geo.error || (userPos && !data.originInsideDF ? 'Sua localização está fora do Distrito Federal. Mostrando os pontos mais próximos disponíveis.' : null);

  const search = { value: query, onSubmit: submitSearch, onPickRegion: pickRegion, onPickPoint: pickPoint };

  return (
    <>
      <Header onLocate={locate} locating={geo.loading} />
      <main>
        <Hero search={search} material={material} onMaterial={setMaterial} onLocate={locate} locating={geo.loading} />
        <MapSection
          data={data}
          regions={regions}
          search={search}
          selected={selected}
          onSelect={setSelectedId}
          userPos={userPos}
          notice={notice}
          focus={focus}
          onLocate={locate}
          locating={geo.loading}
          emptyMessage={
            <>
              {emptyMessage} <a href="#indique" className="eco-link">Indique um ponto</a>
            </>
          }
          filters={{
            material, region, radiusKm,
            onMaterial: setMaterial,
            onRegion: (v) => { setRegion(v); if (v) setQuery(''); setSelectedId(null); },
            onRadius: setRadiusKm,
            onReset: reset
          }}
        />
        <SuggestForm regions={regions} />
        <AboutContact />
      </main>
    </>
  );
}
