'use client';
import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

const MATERIALS = [
  { slug: 'pilhas', label: 'Pilhas' },
  { slug: 'baterias', label: 'Baterias' },
  { slug: 'oleo-vegetal', label: 'Óleo vegetal' }
];

export default function SuggestForm({ regions }) {
  const [form, setForm] = useState({ name: '', address: '', region: '', phone: '', notes: '', materials: [] });
  const [state, setState] = useState({ status: 'idle', message: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (slug) =>
    setForm((f) => ({ ...f, materials: f.materials.includes(slug) ? f.materials.filter((s) => s !== slug) : [...f.materials, slug] }));

  async function submit(e) {
    e.preventDefault();
    if (!form.materials.length) return setState({ status: 'error', message: 'Selecione ao menos um material.' });
    setState({ status: 'sending', message: '' });
    try {
      const res = await api.post('/suggestions', { ...form, region: form.region || undefined, phone: form.phone || undefined, notes: form.notes || undefined });
      setState({ status: 'ok', message: res.message });
      setForm({ name: '', address: '', region: '', phone: '', notes: '', materials: [] });
    } catch (err) {
      setState({ status: 'error', message: err.status === 429 ? 'Você enviou muitas sugestões. Tente mais tarde.' : err.message });
    }
  }

  return (
    <section id="indique" className="eco-section">
      <div className="container-xl">
        <div className="eco-glass p-4 p-lg-5">
          <div className="row g-4">
            <div className="col-lg-4">
              <span className="eco-kicker">COMUNIDADE</span>
              <h2>Indique um ponto de coleta</h2>
              <p className="eco-muted">Conhece um local que recebe pilhas, baterias ou óleo vegetal? Envie. Toda indicação passa por verificação antes de aparecer no mapa.</p>
            </div>
            <form className="col-lg-8" onSubmit={submit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="s-name">Nome do estabelecimento</label>
                  <input id="s-name" className="form-control eco-input" required minLength={3} maxLength={150} value={form.name} onChange={set('name')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="s-region">Região administrativa</label>
                  <select id="s-region" className="form-select eco-input" value={form.region} onChange={set('region')}>
                    <option value="">Selecione</option>
                    {regions.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="s-address">Endereço</label>
                  <input id="s-address" className="form-control eco-input" required minLength={5} maxLength={250} value={form.address} onChange={set('address')} />
                </div>
                <div className="col-12">
                  <span className="form-label d-block">Material recebido</span>
                  <div className="d-flex flex-wrap gap-2">
                    {MATERIALS.map((m) => (
                      <button type="button" key={m.slug} className={`eco-pill ${form.materials.includes(m.slug) ? 'is-active' : ''}`} onClick={() => toggle(m.slug)} aria-pressed={form.materials.includes(m.slug)}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="s-phone">Telefone (opcional)</label>
                  <input id="s-phone" type="tel" className="form-control eco-input" maxLength={30} value={form.phone} onChange={set('phone')} />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="s-notes">Informações adicionais (opcional)</label>
                  <textarea id="s-notes" rows={3} className="form-control eco-input" maxLength={1000} value={form.notes} onChange={set('notes')} />
                </div>
                <div className="col-12 d-flex flex-wrap align-items-center gap-3">
                  <button className="btn btn-neon" disabled={state.status === 'sending'}>
                    <Send size={16} /> {state.status === 'sending' ? 'Enviando…' : 'Enviar indicação'}
                  </button>
                  {state.status === 'ok' && <span className="eco-ok"><CheckCircle2 size={16} /> {state.message}</span>}
                  {state.status === 'error' && <span className="eco-err" role="alert">{state.message}</span>}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
