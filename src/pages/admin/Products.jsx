import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS as LOCAL_PRODUCTS, CATEGORIES } from '../../data/products';
import { formatCRC } from '../../lib/currency';
import api from '../../lib/api';

const USE_API = import.meta.env.VITE_API_URL;

function useAdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (!USE_API) {
      setProducts(LOCAL_PRODUCTS);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/products/admin/all');
      setProducts(data.products || []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id) => {
    if (!USE_API) return;
    await api.patch(`/products/${id}/toggle`);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    if (!USE_API) return;
    await api.delete(`/products/${id}`);
    load();
  };

  return { products, loading, load, toggle, remove };
}

/* ── Product row — desktop table ── */
function ProductRow({ p, toggle, remove }) {
  const img      = p.images?.[0] || p.img || '';
  const category = p.category || p.cat;
  const isActive = p.isActive !== false;
  const id       = p._id || p.id;

  return (
    <tr className={`hover:bg-cream-50 transition-colors ${!isActive ? 'opacity-50' : ''}`}>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {img && <img src={img} alt={p.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />}
          <div className="min-w-0">
            <p className="font-semibold text-ink-900 truncate max-w-[200px]">{p.name}</p>
            <p className="text-xs text-ink-400">{p.brand}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 hidden md:table-cell">
        <span className="px-2.5 py-1 bg-cream-100 text-ink-600 rounded-full text-xs capitalize">{category}</span>
      </td>
      <td className="px-4 py-4">
        <p className="font-semibold text-ink-900 whitespace-nowrap">{formatCRC(p.price)}</p>
        {p.oldPrice && <p className="text-xs text-ink-400 line-through">{formatCRC(p.oldPrice)}</p>}
      </td>
      <td className="px-4 py-4 hidden lg:table-cell">
        <button onClick={() => toggle(id)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}>
          {isActive ? 'Activo' : 'Inactivo'}
        </button>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 justify-center">
          <Link to={`/producto/${p.slug}`} target="_blank"
            className="p-1.5 text-ink-400 hover:text-rose-500 transition-colors" title="Ver">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </Link>
          <Link to={`/admin/productos/${id}/editar`}
            className="p-1.5 text-ink-400 hover:text-rose-500 transition-colors" title="Editar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </Link>
          <button onClick={() => remove(id)}
            className="p-1.5 text-ink-400 hover:text-red-500 transition-colors" title="Eliminar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Product card — mobile ── */
function ProductCard({ p, toggle, remove }) {
  const img      = p.images?.[0] || p.img || '';
  const category = p.category || p.cat;
  const isActive = p.isActive !== false;
  const id       = p._id || p.id;

  return (
    <div className={`bg-white rounded-xl2 shadow-card p-4 flex gap-3 ${!isActive ? 'opacity-60' : ''}`}>
      {img && <img src={img} alt={p.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-ink-900 text-sm leading-tight line-clamp-2">{p.name}</p>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <p className="text-xs text-ink-400 mb-1">{p.brand} · <span className="capitalize">{category}</span></p>
        <p className="font-bold text-ink-900 text-sm">{formatCRC(p.price)}</p>
      </div>
      <div className="flex flex-col gap-1 items-center justify-center pl-1 border-l border-cream-100">
        <Link to={`/producto/${p.slug}`} target="_blank"
          className="p-2 text-ink-400 hover:text-rose-500 transition-colors" title="Ver">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </Link>
        <Link to={`/admin/productos/${id}/editar`}
          className="p-2 text-ink-400 hover:text-rose-500 transition-colors" title="Editar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </Link>
        <button onClick={() => remove(id)}
          className="p-2 text-ink-400 hover:text-red-500 transition-colors" title="Eliminar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [cat, setCat]       = useState('todos');
  const { products, loading, toggle, remove } = useAdminProducts();

  const filtered = products.filter((p) => {
    const matchCat = cat === 'todos' || (p.category || p.cat) === cat;
    const matchQ   = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">Productos</h1>
        <Link to="/admin/productos/nuevo"
          className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-btn whitespace-nowrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl2 shadow-card p-3 sm:p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o marca..."
          className="flex-1 border border-cream-200 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-rose-400 transition-colors" />
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          className="border border-cream-200 rounded-lg px-3 py-2 text-sm text-ink-700 focus:outline-none cursor-pointer bg-white">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'todos' ? 'Todas las categorías' : c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-ink-400">Cargando productos...</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl2 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-200 bg-cream-50">
                    <th className="text-left px-5 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide">Producto</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide">Precio</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide hidden lg:table-cell">Estado</th>
                    <th className="px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {filtered.map((p) => (
                    <ProductRow key={p._id || p.id} p={p} toggle={toggle} remove={remove} />
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-ink-400">No se encontraron productos.</div>
            )}
            <div className="px-5 py-3 border-t border-cream-200 text-xs text-ink-400">
              {filtered.length} de {products.length} productos
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-ink-400">No se encontraron productos.</div>
            ) : (
              filtered.map((p) => (
                <ProductCard key={p._id || p.id} p={p} toggle={toggle} remove={remove} />
              ))
            )}
            <p className="text-center text-xs text-ink-400 py-2">
              {filtered.length} de {products.length} productos
            </p>
          </div>
        </>
      )}
    </div>
  );
}
