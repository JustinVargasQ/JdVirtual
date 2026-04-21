import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS as LOCAL_PRODUCTS, CATEGORIES } from '../../data/products';
import { formatCRC } from '../../lib/currency';
import api, { assetUrl } from '../../lib/api';
import useToastStore from '../../store/toastStore';

const USE_API = import.meta.env.VITE_API_URL;

function useAdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const toast      = useToastStore();
  const askConfirm = useToastStore((s) => s.askConfirm);

  const load = useCallback(async () => {
    setLoading(true);
    if (!USE_API) { setProducts(LOCAL_PRODUCTS); setLoading(false); return; }
    try {
      const { data } = await api.get('/products/admin/all');
      setProducts(data.products || []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id) => {
    if (!USE_API) return;
    try {
      const { data } = await api.patch(`/products/${id}/toggle`);
      setProducts((prev) => prev.map((p) => ((p._id || p.id) === id ? data : p)));
      toast.success(data.isActive ? 'Producto activado' : 'Producto desactivado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cambiar el estado');
    }
  };

  const remove = async (id, name) => {
    const ok = await askConfirm({
      title: 'Eliminar producto',
      message: `¿Eliminar "${name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    if (!USE_API) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id));
      toast.success('Producto eliminado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar');
    }
  };

  return { products, loading, load, toggle, remove };
}

/* ── Skeleton row ── */
function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-cream-100 rounded animate-pulse" style={{ width: ['60%','40%','30%','25%','20%','15%'][i] }} />
        </td>
      ))}
    </tr>
  );
}

/* ── Product row — desktop ── */
function ProductRow({ p, toggle, remove }) {
  const img      = assetUrl(p.images?.[0] || p.img || '');
  const category = p.category || p.cat;
  const isActive = p.isActive !== false;
  const id       = p._id || p.id;

  return (
    <tr className={`hover:bg-cream-50/60 transition-colors border-b border-cream-100 last:border-0 ${!isActive ? 'opacity-50' : ''}`}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          {img
            ? <img src={img} alt={p.name} className="w-10 h-10 object-cover rounded-xl flex-shrink-0 border border-cream-200" />
            : <div className="w-10 h-10 rounded-xl bg-cream-100 flex-shrink-0 flex items-center justify-center text-ink-300 text-xs">📷</div>
          }
          <div className="min-w-0">
            <p className="font-semibold text-ink-900 text-sm truncate max-w-[180px]">{p.name}</p>
            <p className="text-xs text-ink-400">{p.brand}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className="px-2.5 py-1 bg-cream-100 text-ink-600 rounded-full text-xs font-medium capitalize">{category}</span>
      </td>
      <td className="px-4 py-3.5">
        <p className="font-bold text-ink-900 text-sm whitespace-nowrap">{formatCRC(p.price)}</p>
        {p.oldPrice && <p className="text-xs text-ink-300 line-through">{formatCRC(p.oldPrice)}</p>}
      </td>
      <td className="px-4 py-3.5 hidden xl:table-cell">
        {typeof p.stock === 'number'
          ? <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              p.stock === 0 ? 'bg-red-50 text-red-600' : p.stock <= 5 ? 'bg-yellow-50 text-yellow-700' : 'bg-cream-100 text-ink-600'
            }`}>
              {p.stock === 0 ? 'Agotado' : `${p.stock} un.`}
            </span>
          : <span className="text-xs text-ink-300">—</span>}
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <button onClick={() => toggle(id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-ink-400'}`} />
          {isActive ? 'Activo' : 'Inactivo'}
        </button>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-0.5">
          <Link to={`/producto/${p.slug}`} target="_blank"
            className="p-2 text-ink-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Ver en tienda">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </Link>
          <Link to={`/admin/productos/${id}/editar`}
            className="p-2 text-ink-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </Link>
          <button onClick={() => remove(id, p.name)}
            className="p-2 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Product card — mobile ── */
function ProductCard({ p, toggle, remove }) {
  const img      = assetUrl(p.images?.[0] || p.img || '');
  const category = p.category || p.cat;
  const isActive = p.isActive !== false;
  const id       = p._id || p.id;

  return (
    <div className={`bg-white rounded-2xl border border-cream-100 shadow-card p-4 flex gap-3 ${!isActive ? 'opacity-60' : ''}`}>
      {img
        ? <img src={img} alt={p.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0 border border-cream-100" />
        : <div className="w-14 h-14 rounded-xl bg-cream-100 flex-shrink-0 flex items-center justify-center text-ink-300">📷</div>
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="font-semibold text-ink-900 text-sm leading-tight line-clamp-2">{p.name}</p>
          <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            isActive ? 'bg-green-50 text-green-700' : 'bg-ink-100 text-ink-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-ink-400'}`} />
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <p className="text-xs text-ink-400 mb-1">{p.brand} · <span className="capitalize">{category}</span></p>
        <div className="flex items-center gap-2">
          <p className="font-bold text-ink-900 text-sm">{formatCRC(p.price)}</p>
          {typeof p.stock === 'number' && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              p.stock === 0 ? 'bg-red-50 text-red-600' : p.stock <= 5 ? 'bg-yellow-50 text-yellow-700' : 'bg-cream-100 text-ink-500'
            }`}>
              {p.stock === 0 ? 'Agotado' : `Stock ${p.stock}`}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 items-center justify-center pl-2 border-l border-cream-100">
        <Link to={`/producto/${p.slug}`} target="_blank"
          className="p-2 text-ink-300 hover:text-rose-500 rounded-lg transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </Link>
        <Link to={`/admin/productos/${id}/editar`}
          className="p-2 text-ink-300 hover:text-blue-500 rounded-lg transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </Link>
        <button onClick={() => remove(id, p.name)}
          className="p-2 text-ink-300 hover:text-red-500 rounded-lg transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
    const matchQ   = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const activeCount = products.filter(p => p.isActive !== false).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 leading-none">Productos</h1>
          <p className="text-ink-400 text-sm mt-1">{activeCount} activos de {products.length} en total</p>
        </div>
        <Link to="/admin/productos/nuevo"
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-btn whitespace-nowrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo producto
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o marca..."
            className="w-full pl-9 pr-4 border border-cream-200 rounded-xl py-2.5 text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all bg-white" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          className="border border-cream-200 rounded-xl px-3 py-2.5 text-sm text-ink-700 focus:outline-none focus:border-rose-400 cursor-pointer bg-white">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'todos' ? 'Todas las categorías' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        {(search || cat !== 'todos') && (
          <button onClick={() => { setSearch(''); setCat('todos'); }}
            className="text-xs text-ink-400 hover:text-rose-500 font-medium transition-colors whitespace-nowrap px-1">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-cream-100 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream-50 border-b border-cream-200">
              <th className="text-left px-5 py-3.5 text-[11px] font-bold text-ink-400 uppercase tracking-widest">Producto</th>
              <th className="text-left px-4 py-3.5 text-[11px] font-bold text-ink-400 uppercase tracking-widest hidden md:table-cell">Categoría</th>
              <th className="text-left px-4 py-3.5 text-[11px] font-bold text-ink-400 uppercase tracking-widest">Precio</th>
              <th className="text-left px-4 py-3.5 text-[11px] font-bold text-ink-400 uppercase tracking-widest hidden xl:table-cell">Stock</th>
              <th className="text-left px-4 py-3.5 text-[11px] font-bold text-ink-400 uppercase tracking-widest hidden lg:table-cell">Estado</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-ink-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
                ? <tr><td colSpan={6} className="text-center py-14 text-ink-400">No se encontraron productos.</td></tr>
                : filtered.map((p) => <ProductRow key={p._id || p.id} p={p} toggle={toggle} remove={remove} />)
            }
          </tbody>
        </table>
        {!loading && (
          <div className="px-5 py-3 border-t border-cream-100 text-xs text-ink-400 flex items-center justify-between">
            <span>Mostrando <strong className="text-ink-700">{filtered.length}</strong> de <strong className="text-ink-700">{products.length}</strong> productos</span>
            {filtered.length !== products.length && (
              <span className="text-rose-500 font-medium">{products.length - filtered.length} filtrados</span>
            )}
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-cream-100 shadow-card p-4 flex gap-3">
                <div className="w-14 h-14 rounded-xl bg-cream-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 bg-cream-100 animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-cream-100 animate-pulse rounded w-1/2" />
                  <div className="h-3.5 bg-cream-100 animate-pulse rounded w-1/4" />
                </div>
              </div>
            ))
          : filtered.length === 0
            ? <div className="text-center py-12 text-ink-400">No se encontraron productos.</div>
            : filtered.map((p) => <ProductCard key={p._id || p.id} p={p} toggle={toggle} remove={remove} />)
        }
        {!loading && filtered.length > 0 && (
          <p className="text-center text-xs text-ink-400 py-1">{filtered.length} de {products.length} productos</p>
        )}
      </div>
    </div>
  );
}
