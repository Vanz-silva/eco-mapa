'use client';
import { useState } from 'react';
import { Navigation, Clock, Phone, MapPin, ShieldCheck, ExternalLink, X, Info, Car, Bike, Footprints, Route } from 'lucide-react';
import MaterialIcon from './MaterialIcon';
import { formatDistance, formatPhone, formatDate, formatDuration } from '@/lib/format';
import { googleDirections, osmLink } from '@/lib/geo';

export function MaterialTags({ materials }) {
  return (
    <div className="eco-tags">
      {materials.map((m) => (
        <span key={m.slug} className={`eco-tag eco-tag--${m.slug === 'oleo-vegetal' ? 'cyan' : 'purple'}`}>
          <MaterialIcon slug={m.slug} size={14} /> {m.name}
        </span>
      ))}
    </div>
  );
}

const MODES = [
  { id: 'driving', label: 'Carro', Icon: Car },
  { id: 'cycling', label: 'Bicicleta', Icon: Bike },
  { id: 'walking', label: 'A pé', Icon: Footprints }
];

// route = { mode, loading, error, data } quando há rota ativa para este ponto; senão null.
export default function PointCard({ point: p, userPos, onClose, route, onRoute, onClearRoute }) {
  const [more, setMore] = useState(false);
  const dist = formatDistance(p.distanceM);
  const phone = formatPhone(p.phone);

  return (
    <article className="eco-card-float" aria-label={p.name}>
      {onClose && (
        <button className="eco-icon-btn eco-card-float__close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
      )}
      <h3>{p.name}</h3>
      <p className="eco-muted mb-2"><MapPin size={14} /> {p.address}{p.region ? ` · ${p.region.name}` : ''}</p>
      <MaterialTags materials={p.materials} />

      <ul className="eco-meta">
        {dist && <li><Navigation size={14} /> {dist} em linha reta</li>}
        <li><Clock size={14} /> {p.openingHours || 'Horário não informado'}</li>
        {phone && <li><Phone size={14} /> <a href={`tel:${p.phone}`}>{phone}</a></li>}
      </ul>

      {route && (
        <div className="eco-route-box" aria-live="polite">
          <div className="eco-modes" role="group" aria-label="Meio de transporte">
            {MODES.map(({ id, label, Icon }) => (
              <button key={id} type="button" className={`eco-mode ${route.mode === id ? 'is-active' : ''}`} onClick={() => onRoute(id)} aria-pressed={route.mode === id}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
          {route.loading && <p className="eco-muted mb-0 mt-2">Calculando rota…</p>}
          {route.error && <p className="eco-err mb-0 mt-2" role="alert">{route.error}</p>}
          {route.data && (
            <p className="eco-route-summary">
              <strong>{formatDuration(route.data.durationS)}</strong>
              <span>{formatDistance(route.data.distanceM)} pelo trajeto</span>
              <small className="eco-muted d-block">Estimativa pelo mapa; trânsito e obras não são considerados. {route.data.provider}</small>
            </p>
          )}
        </div>
      )}

      {more && (
        <div className="eco-more">
          {p.description && <p>{p.description}</p>}
          {p.extraInfo && <p>{p.extraInfo}</p>}
          <p className="eco-muted mb-0">
            Fonte: {p.sourceUrl ? <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">{p.source}</a> : p.source}
            {' · '}atualizado em {formatDate(p.lastUpdated)}
          </p>
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mt-3 align-items-center">
        {route ? (
          <button className="btn btn-ghost btn-sm" onClick={onClearRoute}><Route size={16} /> Limpar rota</button>
        ) : (
          <button className="btn btn-neon btn-sm" onClick={() => onRoute('driving')}><Route size={16} /> Ver rota</button>
        )}
        <a className="btn btn-ghost btn-sm" href={googleDirections(p, userPos)} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} /> Google Maps
        </a>
        <a className="btn btn-ghost btn-sm" href={osmLink(p, userPos)} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} /> OpenStreetMap
        </a>
        <button className="btn btn-ghost btn-sm" onClick={() => setMore((v) => !v)} aria-expanded={more}>
          <Info size={16} /> {more ? 'Menos informações' : 'Mais informações'}
        </button>
        {p.verificationStatus === 'VERIFIED' && <span className="eco-verified"><ShieldCheck size={14} /> Verificado</span>}
      </div>
    </article>
  );
}
