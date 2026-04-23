import { useState } from 'react';
import { CATEGORIES } from '../../data/products';
import { useBrands } from '../../hooks/useProducts';
import { formatCRC } from '../../lib/currency';

export default function FilterBar({ cat, brand, minPrice, maxPrice, onCat, onBrand, onPrice }) {
  const brands = useBrands();
  const [localMin, setLocalMin] = useState(minPrice || '');
  const [localMax, setLocalMax] = useState(maxPrice || '');

  const catLabels = {
    todos: 'Todos', skincare: 'Skin care', maquillaje: 'Maquillaje',
    accesorios: 'Accesorios', perfumes: 'Perfumes', cabello: 'Cabello',
  };

  const applyPrice = () => {
    onPrice({ minPrice: localMin ? Number(localMin) : '', maxPrice: localMax ? Number(localMax) : '' });
  };

  const clearPrice = () => {
    setLocalMin(''); setLocalMax('');
    onPrice({ minPrice: '', maxPrice: '' });
  };

  const hasPriceFilter = minPrice || maxPrice;

  return (
    <div className="flex flex-col gap-3">
      {/* Brand + Price row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <select value={brand} onChange={(e) => onBrand(e.target.value)}
          className="text-sm border border-cream-200 rounded-lg px-3 py-1.5 text-ink-700 bg-white focus:outline-none focus:border-rose-300 cursor-pointer">
          <option value="">Todas las marcas</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Price range */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-ink-400 uppercase tracking-widest">Precio:</span>
        <input type="number" min="0" placeholder="Min" value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
          className="w-24 border border-cream-200 rounded-lg px-2.5 py-1.5 text-sm text-ink-700 bg-white focus:outline-none focus:border-rose-300" />
        <span className="text-ink-300 text-sm">—</span>
        <input type="number" min="0" placeholder="Max" value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
          className="w-24 border border-cream-200 rounded-lg px-2.5 py-1.5 text-sm text-ink-700 bg-white focus:outline-none focus:border-rose-300" />
        <button onClick={applyPrice}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors">
          Filtrar
        </button>
        {hasPriceFilter && (
          <button onClick={clearPrice}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cream-100 text-ink-600 hover:bg-cream-200 transition-colors">
            × Limpiar precio
          </button>
        )}
        {hasPriceFilter && (
          <span className="text-xs text-rose-500 font-medium">
            {minPrice ? formatCRC(minPrice) : '—'} a {maxPrice ? formatCRC(maxPrice) : '—'}
          </span>
        )}
      </div>
    </div>
  );
}
