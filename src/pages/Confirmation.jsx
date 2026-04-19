import { Link } from 'react-router-dom';

export default function Confirmation() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink-900 mb-4">¡Pedido enviado!</h1>
        <p className="text-ink-500 leading-relaxed mb-8">
          Tu pedido fue enviado por WhatsApp. Estaremos confirmando los detalles y coordinando el envío contigo muy pronto.
        </p>
        <div className="bg-cream-100 rounded-xl p-5 mb-8 text-left text-sm text-ink-600 space-y-2">
          <p className="font-semibold text-ink-900 mb-3">¿Qué sigue?</p>
          <p>✅ Recibimos tu pedido por WhatsApp</p>
          <p>📦 Confirmamos disponibilidad de productos</p>
          <p>💳 Te indicamos cómo realizar el pago (SINPE / transferencia)</p>
          <p>🚚 Coordinamos el envío a tu dirección</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Seguir comprando
          </Link>
          <a href="https://wa.me/50688045100" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-cream-200 hover:border-rose-300 text-ink-700 font-semibold px-6 py-3 rounded-xl transition-colors">
            Abrir WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
