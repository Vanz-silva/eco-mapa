'use client';
import { useState } from 'react';
import { Navigation, Clock, Phone, MapPin, ShieldCheck, ExternalLink, X, Info } from 'lucide-react';
import MaterialIcon from './MaterialIcon';
import { formatDistance, formatPhone, formatDate } from '@/lib/format';
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

// Card completo (flutuante no mapa).
export default function PointCard({ point: p, userPos, onClose }) {
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
        {dist && <li><Navigation size={14} /> {dist} de você</li>}
        <li><Clock size={14} /> {p.openingHours || 'Horário não informado'}</li>
        {phone && <li><Phone size={14} /> <a href={`tel:${p.phone}`}>{phone}</a></li>}
      </ul>

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
        <a className="btn btn-neon btn-sm" href={googleDirections(p, userPos)} target="_blank" rel="noopener noreferrer">
          <Navigation size={16} /> Ver rota
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
