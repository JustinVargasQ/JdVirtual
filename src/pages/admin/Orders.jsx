import { useState, useEffect, useCallback } from 'react';
import { formatCRC } from '../../lib/currency';
import api, { assetUrl } from '../../lib/api';
import useToastStore from '../../store/toastStore';

const USE_API = import.meta.env.VITE_API_URL;

const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200'  },
  confirmado: { label: 'Confirmado', dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200'        },
  preparando: { label: 'Preparando', dot: 'bg-purple-400', badge: 'bg-purple-50 text-purple-700 border-purple-200'  },
  enviado:    { label: 'Enviado',    dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-200'  },
  entregado:  { label: 'Entregado',  dot: 'bg-green-400',  badge: 'bg-green-50 text-green-700 border-green-200'     },
  cancelado:  { label: 'Cancelado',  dot: 'bg-red-400',    badge: 'bg-red-50 text-red-600 border-red-200'           },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, dot: 'bg-ink-400', badge: 'bg-ink-100 text-ink-600 border-ink-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatusSelect({ value, onChange }) {
  return (
    <select value={value} onChange={onChange}
      className="border border-cream-200 rounded-xl px-2.5 py-1.5 text-xs text-ink-700 focus:outline-none focus:border-rose-400 cursor-pointer bg-white transition-colors">
      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
    </select>
  );
}

/* ── Order detail drawer ── */
function OrderDrawer({ order, onClose, onUpdateStatus }) {
  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!order) return null;

  const itemsText = order.items
    .map((i) => `• ${i.name} x${i.qty} — ${formatCRC(i.price * i.qty)}`)
    .join('\n');

  const whatsappMessage = [
    `¡Hola ${order.customer?.name?.split(' ')[0] || ''}! 👋`,
    `Te escribo de JD por tu pedido *${order.orderNumber}*:`,
    '',
    itemsText,
    '',
    `Subtotal: ${formatCRC(order.subtotal)}`,
    order.shippingCost ? `Envío: ${formatCRC(order.shippingCost)}` : null,
    `*Total: ${formatCRC(order.total)}*`,
    '',
    `Dirección de envío:`,
    `${order.customer?.address}, ${order.customer?.province}`,
    '',
    '¿Podemos coordinar el pago y envío? 🙏',
  ].filter(Boolean).join('\n');

  const phone = (order.customer?.phone || '').replace(/\D/g, '');
  const waHref = `https://wa.me/${phone.length === 8 ? '506' + phone : phone}?text=${encodeURIComponent(whatsappMessage)}`;
  const createdAt = new Date(order.createdAt).toLocaleString('es-CR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const copyAddress = () => {
    navigator.clipboard?.writeText(`${order.customer?.name}\n${order.customer?.phone}\n${order.customer?.address}, ${order.customer?.province}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto w-full max-w-xl h-full bg-[#F4F0EF] shadow-2xl flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="bg-white border-b border-cream-200 px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <button onClick={onClose}
            className="p-1.5 text-ink-400 hover:text-ink-900 transition-colors" title="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-mono font-bold text-rose-500 text-sm tracking-wide">{order.orderNumber}</p>
            <p className="text-xs text-ink-400">{createdAt}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Customer card */}
          <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">Cliente</p>
              <button onClick={copyAddress}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold">Copiar datos</button>
            </div>
            <div>
              <p className="font-semibold text-ink-900">{order.customer?.name}</p>
              <a href={`tel:${order.customer?.phone}`} className="text-sm text-ink-500 hover:text-rose-500 transition-colors block">
                📞 {order.customer?.phone}
              </a>
            </div>
            <div className="pt-3 border-t border-cream-100">
              <p className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-1">Envío</p>
              <p className="text-sm text-ink-700">{order.customer?.address}</p>
              <p className="text-xs text-ink-500 mt-0.5">{order.customer?.province}</p>
              <p className="text-[11px] text-ink-400 mt-2 capitalize">Método: {order.shippingMethod}</p>
            </div>
            {order.customer?.notes && (
              <div className="pt-3 border-t border-cream-100">
                <p className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-1">Notas</p>
                <p className="text-sm text-ink-700 whitespace-pre-wrap">{order.customer.notes}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-5">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3">
              Productos ({order.items?.length})
            </p>
            <div className="divide-y divide-cream-100">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {item.image
                    ? <img src={assetUrl(item.image)} alt={item.name} className="w-12 h-12 object-cover rounded-xl border border-cream-200 flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-xl bg-cream-100 flex-shrink-0 flex items-center justify-center text-ink-300 text-xs">📷</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-900 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-ink-400">{item.brand} · {formatCRC(item.price)} c/u</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-ink-900 text-sm whitespace-nowrap">{formatCRC(item.price * item.qty)}</p>
                    <p className="text-xs text-ink-400">× {item.qty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-5 space-y-2 text-sm">
            <div className="flex justify-between text-ink-500">
              <span>Subtotal</span>
              <span>{formatCRC(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span>Envío</span>
              <span>{order.shippingCost ? formatCRC(order.shippingCost) : 'Gratis'}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-cream-100 font-bold text-ink-900 text-base">
              <span>Total</span>
              <span>{formatCRC(order.total)}</span>
            </div>
          </div>

          {/* Status changer */}
          <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-5">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3">Cambiar estado</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <button key={k} onClick={() => onUpdateStatus(order._id, k)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    order.status === k
                      ? 'bg-ink-900 text-white border-ink-900'
                      : 'bg-white text-ink-600 border-cream-200 hover:border-rose-300'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-white border-t border-cream-200 px-5 py-4 flex gap-2 flex-shrink-0">
          <a href={waHref} target="_blank" rel="noopener noreferrer"
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm shadow-btn flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A12 12 0 0 0 3.48 20.52L2 22l1.48-1.48a12 12 0 0 0 17.04-17.04zM12 21a9 9 0 0 1-4.6-1.27l-.33-.2-3.13.82.83-3.07-.21-.33A9 9 0 1 1 12 21z"/><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96s-.47-.15-.67.15-.77.96-.94 1.16-.35.22-.65.07a8 8 0 0 1-2.37-1.46 8.8 8.8 0 0 1-1.64-2.04c-.17-.3 0-.45.13-.6.14-.14.3-.35.45-.52s.2-.3.3-.5a.55.55 0 0 0 0-.52c-.08-.15-.68-1.62-.92-2.22s-.5-.5-.67-.5h-.57a1.1 1.1 0 0 0-.8.37 3.35 3.35 0 0 0-1.04 2.49 5.8 5.8 0 0 0 1.22 3.1 13.4 13.4 0 0 0 5.15 4.56c.72.31 1.28.5 1.72.63a4.16 4.16 0 0 0 1.9.12 3.1 3.1 0 0 0 2.03-1.43 2.53 2.53 0 0 0 .17-1.43c-.07-.12-.27-.2-.56-.35z"/></svg>
            WhatsApp al cliente
          </a>
          <button onClick={onClose}
            className="px-4 py-3 rounded-xl text-sm font-semibold border border-cream-200 text-ink-600 hover:bg-cream-50 transition-colors">
            Cerrar
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ── Pagination ── */
function Pagination({ page, pages, onChange }) {
  const btnCls = 'px-3 py-1.5 rounded-lg text-xs font-semibold border border-cream-200 text-ink-600 hover:bg-cream-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className={btnCls}>← Anterior</button>
      <span className="px-2 text-xs text-ink-500">Página <strong className="text-ink-900">{page}</strong> / {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} className={btnCls}>Siguiente →</button>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ icon, label, value, accent, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-4 sm:p-5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: bg }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="font-display text-xl font-bold truncate" style={{ color: accent }}>{value}</p>
      </div>
    </div>
  );
}

/* ── Order card — mobile ── */
function OrderCard({ o, onOpen, onUpdateStatus }) {
  return (
    <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-4 space-y-3">
      <button onClick={() => onOpen(o)} className="w-full flex items-center justify-between gap-2 text-left">
        <span className="font-mono font-bold text-rose-500 text-sm tracking-wide">{o.orderNumber}</span>
        <StatusBadge status={o.status} />
      </button>
      <button onClick={() => onOpen(o)} className="w-full flex items-center justify-between gap-2 text-left">
        <div>
          <p className="font-semibold text-ink-900 text-sm">{o.customer?.name}</p>
          <p className="text-xs text-ink-400">{o.customer?.phone}</p>
        </div>
        <p className="font-bold text-ink-900 text-base">{formatCRC(o.total)}</p>
      </button>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-cream-100">
        <p className="text-xs text-ink-400">
          {new Date(o.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
        <StatusSelect value={o.status} onChange={(e) => onUpdateStatus(o._id, e.target.value)} />
      </div>
    </div>
  );
}

/* ── No API state ── */
function NoApi() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 leading-none">Órdenes</h1>
        <p className="text-ink-400 text-sm mt-1">Gestión de pedidos</p>
      </div>
      <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cream-100 flex items-center justify-center text-3xl mx-auto mb-5">📦</div>
        <h2 className="font-display text-xl font-semibold text-ink-900 mb-2">Backend no conectado</h2>
        <p className="text-ink-400 text-sm max-w-sm mx-auto leading-relaxed">
          Configurá <code className="bg-cream-100 px-1.5 py-0.5 rounded text-rose-500 text-xs">VITE_API_URL</code> en el archivo{' '}
          <code className="bg-cream-100 px-1.5 py-0.5 rounded text-rose-500 text-xs">.env</code> para gestionar órdenes desde el servidor.
        </p>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function AdminOrders() {
  const [orders, setOrders]             = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected]         = useState(null);
  const [search, setSearch]             = useState('');
  const [debouncedQ, setDebouncedQ]     = useState('');
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);
  const [total, setTotal]               = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [statusFilter, debouncedQ]);

  const load = useCallback(async () => {
    if (!USE_API) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (debouncedQ)   params.q      = debouncedQ;
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/orders/admin/all', { params }),
        api.get('/orders/admin/stats'),
      ]);
      setOrders(ordersRes.data.orders || []);
      setPages(ordersRes.data.pages || 1);
      setTotal(ordersRes.data.total || 0);
      setStats(statsRes.data);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [statusFilter, debouncedQ, page]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/orders/admin/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: data.status } : o)));
      setSelected((s) => (s && s._id === id ? { ...s, status: data.status } : s));
      useToastStore.getState().success(`Estado cambiado a "${STATUS_CONFIG[status]?.label || status}"`);
      api.get('/orders/admin/stats').then((r) => setStats(r.data)).catch(() => {});
    } catch (err) {
      useToastStore.getState().error(err.response?.data?.error || 'No se pudo cambiar el estado');
    }
  };

  if (!USE_API) return <NoApi />;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 leading-none">Órdenes</h1>
        <p className="text-ink-400 text-sm mt-1">{stats?.totalOrders ?? '—'} órdenes en total</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon="📋" label="Total órdenes"   value={stats.totalOrders}              accent="#B85F72" bg="#FBF0F2" />
          <StatCard icon="🕐" label="Hoy"             value={stats.todayOrders}              accent="#3B82F6" bg="#EFF6FF" />
          <StatCard icon="💰" label="Ingresos semana" value={formatCRC(stats.weekRevenue)}   accent="#16A34A" bg="#F0FDF4" />
          <StatCard icon="⏳" label="Pendientes"      value={stats.statusCounts?.pendiente || 0} accent="#D97706" bg="#FFFBEB" />
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-4 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número de orden, cliente o teléfono..."
            className="w-full pl-9 pr-9 border border-cream-200 rounded-xl py-2.5 text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all bg-white" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600" title="Limpiar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-ink-400 uppercase tracking-widest mr-1">Estado:</span>
          <button onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${!statusFilter ? 'bg-ink-900 text-white' : 'bg-cream-100 text-ink-600 hover:bg-cream-200'}`}>
            Todos
          </button>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <button key={k} onClick={() => setStatusFilter(k)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === k ? 'bg-ink-900 text-white' : 'bg-cream-100 text-ink-600 hover:bg-cream-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
              {v.label}
              {stats?.statusCounts?.[k] ? <span className={`text-[10px] ${statusFilter === k ? 'text-white/70' : 'text-ink-400'}`}>{stats.statusCounts[k]}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-8 text-center text-ink-400 text-sm">
          Cargando órdenes...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-14 text-center">
          <div className="text-3xl mb-3">📭</div>
          <p className="text-ink-400 font-medium">
            {debouncedQ
              ? `No hay resultados para "${debouncedQ}".`
              : `No hay órdenes${statusFilter ? ' con este estado' : ' todavía'}.`}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-cream-100 shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream-50 border-b border-cream-200">
                  {['Orden','Cliente','Total','Estado','Fecha','Cambiar estado'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold text-ink-400 uppercase tracking-widest first:px-5 last:px-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}
                    onClick={() => setSelected(o)}
                    className="hover:bg-cream-50/60 transition-colors border-b border-cream-100 last:border-0 cursor-pointer">
                    <td className="px-5 py-3.5 font-mono font-bold text-rose-500 text-sm tracking-wide">{o.orderNumber}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-ink-900 text-sm">{o.customer?.name}</p>
                      <p className="text-xs text-ink-400">{o.customer?.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-ink-900 whitespace-nowrap">{formatCRC(o.total)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3.5 text-ink-400 text-xs whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <StatusSelect value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-cream-100 text-xs text-ink-400 flex items-center justify-between">
              <span>Mostrando <strong className="text-ink-700">{orders.length}</strong> de <strong className="text-ink-700">{total}</strong></span>
              {pages > 1 && (
                <Pagination page={page} pages={pages} onChange={setPage} />
              )}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <OrderCard key={o._id} o={o} onOpen={setSelected} onUpdateStatus={updateStatus} />
            ))}
            {pages > 1 && (
              <div className="pt-2">
                <Pagination page={page} pages={pages} onChange={setPage} />
              </div>
            )}
          </div>
        </>
      )}

      {selected && (
        <OrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
}
