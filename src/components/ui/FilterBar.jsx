import { CATEGORIES } from '../../data/products';
import { useBrands } from '../../hooks/useProducts';

export default function FilterBar({ cat, brand, onCat, onBrand }) {
  const brands = useBrands();

  const catLabels = {
    todos: 'Todos', skincare: 'Skin care', maquillaje: 'Maquillaje',
    accesorios: 'Accesorios', perfumes: 'Perfumes', cabello: 'Cabello',
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => onCat(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              cat === c
                ? 'bg-rose-500 text-white shadow-btn'
                : 'bg-white text-ink-700 border border-cream-200 hover:border-rose-300 hover:text-rose-500'
            }`}
          >
            {catLabels[c] || c}
          </button>
        ))}
      </div>

      {/* Brand select */}
      <select
        value={brand}
        onChange={(e) => onBrand(e.target.value)}
        className="ml-auto text-sm border border-cream-200 rounded-lg px-3 py-1.5 text-ink-700 bg-white focus:outline-none focus:border-rose-300 cursor-pointer"
      >
        <option value="">Todas las marcas</option>
        {brands.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
    </div>
  );
}
