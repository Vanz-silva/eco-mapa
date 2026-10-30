'use client';
import MaterialIcon from './MaterialIcon';
import { DISTANCES } from '@/lib/constants';

const MATERIALS = [
  { slug: '', label: 'Todos os materiais' },
  { slug: 'pilhas', label: 'Pilhas' },
  { slug: 'baterias', label: 'Baterias' },
  { slug: 'oleo-vegetal', label: 'Óleo vegetal' }
];

export default function FiltersPanel({ regions, material, region, radiusKm, hasUserPos, onMaterial, onRegion, onRadius, onReset, onLocate, locating }) {
  return (
    <div className="eco-filters">
      <fieldset>
        <legend>Tipo de material</legend>
        <div className="d-flex flex-wrap gap-2">
          {MATERIALS.map((m) => (
            <button
              key={m.slug}
              type="button"
              className={`eco-pill ${material === m.slug ? 'is-active' : ''} ${m.slug === 'oleo-vegetal' ? 'eco-pill--cyan' : ''}`}
              onClick={() => onMaterial(m.slug)}
              aria-pressed={material === m.slug}
            >
              {m.slug && <MaterialIcon slug={m.slug} size={14} />} {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend><label htmlFor="region">Localização</label></legend>
        <select id="region" className="form-select eco-input" value={region} onChange={(e) => onRegion(e.target.value)}>
          <option value="">Todo o Distrito Federal</option>
          {regions.map((r) => (
            <option key={r.slug} value={r.slug}>{r.name}{r.pointCount ? ` (${r.pointCount})` : ''}</option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend>Distância</legend>
        <div className="d-flex flex-wrap gap-2">
          {DISTANCES.map((d) => (
            <button
              key={d.value}
              type="button"
              className={`eco-pill ${radiusKm === d.value ? 'is-active' : ''}`}
              disabled={!hasUserPos}
              onClick={() => onRadius(d.value)}
              aria-pressed={radiusKm === d.value}
            >
              {d.label}
            </button>
          ))}
        </div>
        {!hasUserPos && (
          <button type="button" className="btn btn-link eco-link p-0 mt-2" onClick={onLocate} disabled={locating}>
            Ative sua localização para filtrar por distância
          </button>
        )}
      </fieldset>

      <button type="button" className="btn btn-ghost btn-sm w-100" onClick={onReset}>Limpar filtros</button>
    </div>
  );
}
