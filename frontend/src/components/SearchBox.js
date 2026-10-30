'use client';
import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Building2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

export default function SearchBox({ value, onSubmit, onPickRegion, onPickPoint, onLocate, locating, placeholder }) {
  const [text, setText] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const debounced = useDebounce(text.trim(), 300);
  const box = useRef(null);

  useEffect(() => { setText(value || ''); }, [value]);

  useEffect(() => {
    if (debounced.length < 2) { setItems([]); return; }
    const ctrl = new AbortController();
    api.get('/collection-points/suggest', { q: debounced }, ctrl.signal)
      .then((r) => setItems([...r.regions, ...r.points]))
      .catch(() => setItems([]));
    return () => ctrl.abort();
  }, [debounced]);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    setOpen(false);
    onSubmit(text.trim());
  };

  const pick = (it) => {
    setOpen(false);
    if (it.type === 'region') { setText(it.name); onPickRegion(it); } else { setText(it.name); onPickPoint(it.id); }
  };

  return (
    <div className="eco-search" ref={box}>
      <form onSubmit={submit} role="search" className="eco-search__bar">
        <Search size={18} className="eco-search__icon" aria-hidden="true" />
        <input
          type="search"
          value={text}
          maxLength={100}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || 'Pesquise cidade, região, bairro, CEP ou estabelecimento…'}
          aria-label="Pesquisar pontos de coleta"
          autoComplete="off"
        />
        {text && (
          <button type="button" className="eco-icon-btn" aria-label="Limpar" onClick={() => { setText(''); onSubmit(''); }}>
            <X size={16} />
          </button>
        )}
        {onLocate && (
          <button type="button" className="eco-icon-btn eco-icon-btn--accent" onClick={onLocate} disabled={locating} aria-label="Usar minha localização" title="Usar minha localização">
            <MapPin size={18} />
          </button>
        )}
      </form>

      {open && items.length > 0 && (
        <ul className="eco-suggest" role="listbox">
          {items.map((it) => (
            <li key={`${it.type}-${it.id || it.slug}`} role="option">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(it)}>
                {it.type === 'region' ? <MapPin size={16} /> : <Building2 size={16} />}
                <span>
                  {it.name}
                  <small>{it.type === 'region' ? 'Região administrativa' : it.address}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
