import { useState, useEffect, useCallback } from 'react';
import { formatCRC } from '../../lib/currency';
import api from '../../lib/api';

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
function OrderCard({ o, onUpdateStatus }) {
  return (
    <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-bold text-rose-500 text-sm tracking-wide">{o.orderNumber}</span>
        <StatusBadge status={o.status} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-ink-900 text-sm">{o.customer?.name}</p>
          <p className="text-xs text-ink-400">{o.customer?.phone}</p>
        </div>
        <p className="font-bold text-ink-900 text-base">{formatCRC(o.total)}</p>
      </div>
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

export default function AdminOrders() {
  const [orders, setOrders]             = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    if (!USE_API) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/orders/admin/all', { params }),
        api.get('/orders/admin/stats'),
      ]);
      setOrders(ordersRes.data.orders || []);
      setStats(statsRes.data);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    await api.patch(`/orders/admin/${id}/status`, { status });
    load();
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

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-ink-400 uppercase tracking-widest">Filtrar:</span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${!statusFilter ? 'bg-ink-900 text-white' : 'bg-cream-100 text-ink-600 hover:bg-cream-200'}`}>
            Todos
          </button>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <button key={k} onClick={() => setStatusFilter(k)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === k ? 'bg-ink-900 text-white' : 'bg-cream-100 text-ink-600 hover:bg-cream-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
              {v.label}
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
          <p className="text-ink-400 font-medium">No hay órdenes{statusFilter ? ' con este estado' : ' todavía'}.</p>
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
                  <tr key={o._id} className="hover:bg-cream-50/60 transition-colors border-b border-cream-100 last:border-0">
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
                    <td className="px-4 py-3.5">
                      <StatusSelect value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-cream-100 text-xs text-ink-400">
              {orders.length} órdenes
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => <OrderCard key={o._id} o={o} onUpdateStatus={updateStatus} />)}
          </div>
        </>
      )}
    </div>
  );
}
