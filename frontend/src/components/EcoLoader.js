export default function EcoLoader({ label = 'Carregando mapa…' }) {
  return (
    <div className="eco-loader" role="status" aria-live="polite">
      <div className="eco-loader__ring"><span /></div>
      <p>ECOMAPA DF</p>
      <small>{label}</small>
    </div>
  );
}
