'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from 'lucide-react';
import { MaterialTags } from './PointCard';
import { formatDistance } from '@/lib/format';

export function ResultsSkeleton() {
  return (
    <ul className="eco-results" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => <li key={i} className="eco-skeleton" />)}
    </ul>
  );
}

export default function ResultsList({ points, loading, error, total, selectedId, onSelect, emptyMessage }) {
  const refs = useRef({});
  useEffect(() => { refs.current[selectedId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [selectedId]);

  if (loading) return <ResultsSkeleton />;
  if (error) return <div className="eco-empty" role="alert">{error}</div>;
  if (!points.length) return <div className="eco-empty">{emptyMessage}</div>;

  return (
    <>
      <ul className="eco-results">
        {points.map((p, i) => (
          <motion.li
            key={p.id}
            ref={(el) => { refs.current[p.id] = el; }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.04 }}
          >
            <button type="button" className={`eco-result ${p.id === selectedId ? 'is-selected' : ''}`} onClick={() => onSelect(p.id)}>
              <strong>{p.name}</strong>
              <span className="eco-muted">{p.address}</span>
              <span className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <MaterialTags materials={p.materials} />
                {p.distanceM != null && <span className="eco-dist"><Navigation size={12} /> {formatDistance(p.distanceM)}</span>}
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
      {total > points.length && <p className="eco-muted small mt-2">Mostrando {points.length} de {total} pontos. Refine os filtros para ver os demais.</p>}
    </>
  );
}
