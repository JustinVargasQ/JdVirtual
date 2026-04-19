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
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink-900">Productos</h1>
        <Link to="/admin/productos/nuevo"
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-btn">
          + Nuevo producto
        </Link>
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-4 mb-6 flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o marca..."
          className="flex-1 min-w-48 border border-cream-200 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-rose-400 transition-colors" />
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          className="border border-cream-200 rounded-lg px-3 py-2 text-sm text-ink-700 focus:outline-none cursor-pointer">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'todos' ? 'Todas las categorías' : c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-ink-400">Cargando productos...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide">Producto</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide">Precio</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide hidden lg:table-cell">Estado</th>
                <th className="px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {filtered.map((p) => {
                const img = p.images?.[0] || p.img || '';
                const category = p.category || p.cat;
                const isActive = p.isActive !== false;
                return (
                  <tr key={p._id || p.id} className={`hover:bg-cream-50 transition-colors ${!isActive ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {img && <img src={img} alt={p.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />}
                        <div>
                          <p className="font-semibold text-ink-900 truncate max-w-xs">{p.name}</p>
                          <p className="text-xs text-ink-400">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="px-2.5 py-1 bg-cream-100 text-ink-600 rounded-full text-xs capitalize">{category}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-ink-900">{formatCRC(p.price)}</p>
                      {p.oldPrice && <p className="text-xs text-ink-400 line-through">{formatCRC(p.oldPrice)}</p>}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <button onClick={() => toggle(p._id || p.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <Link to={`/producto/${p.slug}`} target="_blank"
                          className="p-1.5 text-ink-400 hover:text-rose-500 transition-colors" title="Ver">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </Link>
                        <Link to={`/admin/productos/${p._id || p.id}/editar`}
                          className="p-1.5 text-ink-400 hover:text-rose-500 transition-colors" title="Editar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Link>
                        <button onClick={() => remove(p._id || p.id)}
                          className="p-1.5 text-ink-400 hover:text-red-500 transition-colors" title="Eliminar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-ink-400">No se encontraron productos.</div>
        )}
        <div className="px-6 py-4 border-t border-cream-200 text-xs text-ink-400">
          {filtered.length} de {products.length} productos
        </div>
      </div>
    </div>
  );
}
