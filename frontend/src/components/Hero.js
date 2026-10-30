'use client';
import { motion } from 'framer-motion';
import SearchBox from './SearchBox';
import MaterialIcon from './MaterialIcon';

const CHIPS = [
  { slug: 'pilhas', label: 'Pilhas', cls: 'purple' },
  { slug: 'baterias', label: 'Baterias', cls: 'purple' },
  { slug: 'oleo-vegetal', label: 'Óleo vegetal', cls: 'cyan' }
];

export default function Hero({ search, material, onMaterial, onLocate, locating }) {
  return (
    <section id="inicio" className="eco-hero">
      <div className="eco-hero__grid" aria-hidden="true" />
      <div className="eco-orb eco-orb--purple" aria-hidden="true" />
      <div className="eco-orb eco-orb--cyan" aria-hidden="true" />

      <div className="container-xl position-relative">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="eco-hero__content">
          <span className="eco-kicker">PLATAFORMA INTELIGENTE DE COLETA SUSTENTÁVEL</span>
          <h1>
            DESCARTE CERTO.<br />
            <span className="eco-gradient-text">FUTURO SUSTENTÁVEL.</span>
          </h1>
          <p className="lead">
            Descubra os pontos de coleta mais próximos de você e dê o destino correto para pilhas,
            baterias e óleo vegetal usado no Distrito Federal.
          </p>

          <div className="eco-hero__search">
            <SearchBox {...search} onLocate={onLocate} locating={locating} />
          </div>

          <div className="eco-chips" role="group" aria-label="Materiais">
            {CHIPS.map((c, i) => (
              <motion.button
                key={c.slug}
                type="button"
                className={`eco-chip eco-chip--${c.cls} ${material === c.slug ? 'is-active' : ''}`}
                onClick={() => { onMaterial(material === c.slug ? '' : c.slug); document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth' }); }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: [0, -4, 0] }}
                transition={{ opacity: { delay: 0.3 + i * 0.1 }, y: { repeat: Infinity, duration: 4 + i, ease: 'easeInOut' } }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <MaterialIcon slug={c.slug} /> {c.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
