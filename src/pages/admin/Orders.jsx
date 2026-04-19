import { useState, useEffect, useCallback } from 'react';
import { formatCRC } from '../../lib/currency';
import api from '../../lib/api';

const USE_API = import.meta.env.VITE_API_URL;

const STATUS_LABELS = {
  pendiente:  { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700' },
  confirmado: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  preparando: { label: 'Preparando', color: 'bg-purple-100 text-purple-700' },
  enviado:    { label: 'Enviado',    color: 'bg-orange-100 text-orange-700' },
  entregado:  { label: 'Entregado',  color: 'bg-green-100 text-green-700' },
  cancelado:  { label: 'Cancelado',  color: 'bg-red-100 text-red-700' },
};

/* ── Order card — mobile ── */
function OrderCard({ o, onUpdateStatus }) {
  const st = STATUS_LABELS[o.status] || { label: o.status, color: 'bg-ink-100 text-ink-600' };
  return (
    <div className="bg-white rounded-xl2 shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-bold text-rose-500 text-sm">{o.orderNumber}</span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>{st.label}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-ink-900 text-sm">{o.customer?.name}</p>
          <p className="text-xs text-ink-400">{o.customer?.phone}</p>
        </div>
        <p className="font-bold text-ink-900">{formatCRC(o.total)}</p>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-cream-100">
        <p className="text-xs text-ink-400">
          {new Date(o.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
        <select
          value={o.status}
          onChange={(e) => onUpdateStatus(o._id, e.target.value)}
          className="border border-cream-200 rounded-lg px-2 py-1.5 text-xs text-ink-700 focus:outline-none cursor-pointer bg-white">
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders]     = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
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

  if (!USE_API) {
    return (
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 mb-6">Órdenes</h1>
        <div className="bg-white rounded-xl2 shadow-card p-8 sm:p-10 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h2 className="font-display text-xl font-semibold text-ink-900 mb-3">Backend no conectado</h2>
          <p className="text-ink-500 text-sm max-w-md mx-auto">
            Configura <code className="bg-cream-100 px-1.5 py-0.5 rounded text-rose-500">VITE_API_URL</code> en el{' '}
            <code className="bg-cream-100 px-1.5 py-0.5 rounded text-rose-500">.env</code> del frontend y corre el servidor Node.js para gestionar órdenes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 mb-6">Órdenes</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Total órdenes',    value: stats.totalOrders,          color: 'text-rose-500'   },
            { label: 'Hoy',              value: stats.todayOrders,          color: 'text-blue-500'   },
            { label: 'Ingresos semana',  value: formatCRC(stats.weekRevenue), color: 'text-green-600' },
            { label: 'Pendientes',       value: stats.statusCounts?.pendiente || 0, color: 'text-yellow-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl2 shadow-card p-4 sm:p-5">
              <p className="text-xs text-ink-400 uppercase tracking-wide mb-1 truncate">{s.label}</p>
              <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-xl2 shadow-card p-3 sm:p-4 mb-5">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto border border-cream-200 rounded-lg px-3 py-2 text-sm text-ink-700 focus:outline-none cursor-pointer bg-white">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-ink-400">Cargando órdenes...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-ink-400">No hay órdenes todavía.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl2 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-200 bg-cream-50">
                    <th className="text-left px-5 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide">Orden</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide">Total</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                    <th className="px-4 py-4 text-xs font-semibold text-ink-400 uppercase tracking-wide">Cambiar estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {orders.map((o) => {
                    const st = STATUS_LABELS[o.status] || { label: o.status, color: 'bg-ink-100 text-ink-600' };
                    return (
                      <tr key={o._id} className="hover:bg-cream-50 transition-colors">
                        <td className="px-5 py-4 font-mono font-semibold text-rose-500">{o.orderNumber}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-ink-900">{o.customer?.name}</p>
                          <p className="text-xs text-ink-400">{o.customer?.phone}</p>
                        </td>
                        <td className="px-4 py-4 font-bold text-ink-900 whitespace-nowrap">{formatCRC(o.total)}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-4 text-ink-500 text-xs whitespace-nowrap hidden lg:table-cell">
                          {new Date(o.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={o.status}
                            onChange={(e) => updateStatus(o._id, e.target.value)}
                            className="border border-cream-200 rounded-lg px-2 py-1.5 text-xs text-ink-700 focus:outline-none cursor-pointer bg-white">
                            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <OrderCard key={o._id} o={o} onUpdateStatus={updateStatus} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
