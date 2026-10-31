import { Recycle, ShieldCheck, Map } from 'lucide-react';

export default function AboutContact() {
  return (
    <>
      <section id="sobre" className="eco-section">
        <div className="container-xl">
          <span className="eco-kicker">SOBRE</span>
          <h2>Descarte correto, sem adivinhar</h2>
          <div className="row g-3 mt-1">
            {[
              [Map, 'Mapa aberto', 'Dados cartográficos do OpenStreetMap, com pontos de coleta no Distrito Federal.'],
              [ShieldCheck, 'Só dados verificados', 'Cada ponto mostra a fonte e a data da última atualização. Indicações da comunidade só entram após verificação.'],
              [Recycle, 'Três materiais', 'Pilhas, baterias e óleo vegetal usado: itens que não devem ir para o lixo comum.']
            ].map(([Icon, title, text]) => (
              <div className="col-md-4" key={title}>
                <div className="eco-glass p-4 h-100"><Icon size={22} className="eco-accent mb-2" /><h3 className="h5">{title}</h3><p className="eco-muted mb-0">{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="eco-section pb-5">
        <div className="container-xl">
          <span className="eco-kicker">CONTATO</span>
          <h2>Fale com o EcoMapa DF</h2>
          <p className="eco-muted">Para sugerir ou corrigir um ponto, use o formulário &ldquo;Indique um ponto de coleta&rdquo; acima. Canais de contato diretos serão divulgados em breve.</p>
        </div>
      </section>
      <footer className="eco-footer">
        <div className="container-xl">
          © {new Date().getFullYear()} EcoMapa DF · Mapa © contribuidores do OpenStreetMap
        </div>
      </footer>
    </>
  );
}
