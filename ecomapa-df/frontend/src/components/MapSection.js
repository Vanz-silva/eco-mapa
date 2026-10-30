'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, AlertCircle } from 'lucide-react';
import SearchBox from './SearchBox';
import FiltersPanel from './FiltersPanel';
import ResultsList from './ResultsList';
import PointCard from './PointCard';
import EcoLoader from './EcoLoader';

// Leaflet depende do navegador: carregamento tardio, sem SSR.
const CollectionMap = dynamic(() => import('./CollectionMap'), { ssr: false, loading: () => <EcoLoader /> });

export default function MapSection({ data, filters, regions, search, selected, onSelect, userPos, notice, focus, route, routeCoords, onRoute, onClearRoute, onLocate, locating, emptyMessage }) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <section id="mapa" className="eco-section">
      <div className="container-xl">
        <div className="row g-3">
          <div className="col-12 col-lg-9">
            <div className="eco-map-wrap">
              <div className="eco-map-search"><SearchBox {...search} onLocate={onLocate} locating={locating} /></div>

              {notice && (
                <div className="eco-notice" role="status"><AlertCircle size={16} /> {notice}</div>
              )}

              <CollectionMap points={data.points} selectedId={selected?.id ?? null} onSelect={onSelect} userPos={userPos} focus={focus} route={routeCoords} />

              <AnimatePresence>
                {selected && (
                  <motion.div
                    key={selected.id}
                    className="eco-card-anchor"
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  >
                    <PointCard point={selected} userPos={userPos} onClose={() => onSelect(null)} route={route} onRoute={(mode) => onRoute(selected, mode)} onClearRoute={onClearRoute} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <aside className="col-12 col-lg-3">
            <div className="eco-panel">
              <button type="button" className="btn btn-ghost w-100 d-lg-none mb-2" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>
                <SlidersHorizontal size={16} /> Filtros
              </button>
              <div className={filtersOpen ? '' : 'd-none d-lg-block'}>
                <FiltersPanel {...filters} regions={regions} hasUserPos={!!userPos} onLocate={onLocate} locating={locating} />
              </div>

              <h2 className="eco-panel__title">
                {userPos ? 'Pontos mais próximos' : 'Pontos de coleta'}
                {!data.loading && !data.error && <span className="eco-count">{data.total}</span>}
              </h2>
              <ResultsList
                points={data.points}
                loading={data.loading}
                error={data.error}
                total={data.total}
                selectedId={selected?.id ?? null}
                onSelect={onSelect}
                emptyMessage={emptyMessage}
              />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
