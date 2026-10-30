'use client';
import { useEffect, useState } from 'react';
import { Recycle, Crosshair } from 'lucide-react';
import { checkHealth } from '@/lib/api';

const NAV = [
  { href: '#inicio', label: 'Início' },
  { href: '#mapa', label: 'Mapa de Coleta' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#contato', label: 'Contato' }
];

export default function Header({ onLocate, locating }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let alive = true;
    checkHealth().then(() => alive && setStatus('online')).catch(() => alive && setStatus('offline'));
    return () => { alive = false; };
  }, []);

  return (
    <header className="eco-header">
      <div className="container-xl d-flex align-items-center gap-3 py-2">
        <a href="#inicio" className="eco-logo text-decoration-none">
          <span className="eco-logo__mark"><Recycle size={22} /></span>
          <span>
            <strong>ECOMAPA DF</strong>
            <small className="d-none d-sm-block">Encontre. Descarte. Transforme.</small>
          </span>
        </a>

        <nav className="d-none d-lg-flex gap-4 mx-auto" aria-label="Principal">
          {NAV.map((n) => <a key={n.href} href={n.href} className="eco-nav-link">{n.label}</a>)}
        </nav>

        <div className="d-flex align-items-center gap-3 ms-auto ms-lg-0">
          <span className={`eco-status eco-status--${status}`} title="Estado da API">
            <i /> {status === 'online' ? 'ONLINE' : status === 'offline' ? 'OFFLINE' : '…'}
          </span>
          <button className="btn btn-neon btn-sm d-none d-md-inline-flex" onClick={onLocate} disabled={locating}>
            <Crosshair size={16} /> {locating ? 'Localizando…' : 'Encontrar pontos próximos'}
          </button>
        </div>
      </div>
    </header>
  );
}
