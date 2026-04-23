import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ui/ProductCard';

export default function Offers() {
  const { products, loading } = useProducts({ cat: 'todos' });
  const offers = products.filter((p) => p.oldPrice && p.oldPrice > p.price);

  return (
    <main className="pt-24 pb-20 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-10">
          <Link to="/" className="text-sm text-ink-400 hover:text-rose-500 transition-colors">← Volver</Link>
          <div className="mt-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white text-xl">%</div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink-900">Ofertas</h1>
              <p className="text-ink-400 text-sm mt-0.5">{offers.length} productos en descuento</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-cream-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🏷️</div>
            <p className="text-ink-400 text-lg font-medium">No hay ofertas activas en este momento.</p>
            <Link to="/" className="mt-5 inline-block text-rose-500 font-semibold hover:underline">Ver todos los productos</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {offers.map((p, i) => <ProductCard key={p.id || p.slug} product={p} index={i} />)}
          </div>
        )}
      </div>
    </main>
  );
}
