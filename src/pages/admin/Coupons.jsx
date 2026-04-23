import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import useToastStore from '../../store/toastStore';
import { formatCRC } from '../../lib/currency';

const USE_API = import.meta.env.VITE_API_URL;

const TYPE_LABELS = {
  percent:  { label: 'Porcentaje',    tag: 'bg-rose-50 text-rose-600',    desc: (v) => `-${v}% del subtotal` },
  fixed:    { label: 'Monto fijo',    tag: 'bg-blue-50 text-blue-600',    desc: (v) => `-${formatCRC(v)}` },
  shipping: { label: 'Envío gratis',  tag: 'bg-green-50 text-green-700',  desc: () => 'Envío 100% gratis' },
};

const emptyForm = { code: '', type: 'percent', value: 10, description: '', minOrder: 0, maxUses: 0, expiresAt: '' };

function toIsoDateTime(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return '';
  // datetime-local needs YYYY-MM-DDTHH:MM in local time
  const offset = dt.getTimezoneOffset() * 60000;
  return new Date(dt - offset).toISOString().slice(0, 16);
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [usesModal, setUsesModal] = useState(null); // { code, orders }
  const [usesLoading, setUsesLoading] = useState(false);
  const toast      = useToastStore();
  const askConfirm = useToastStore((s) => s.askConfirm);

  const load = useCallback(async () => {
    if (!USE_API) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/coupons/admin/all');
      setCoupons(data.coupons || []);
    } catch {
      setCoupons([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      description: c.description || '',
      minOrder: c.minOrder || 0,
      maxUses: c.maxUses || 0,
      expiresAt: toIsoDateTime(c.expiresAt),
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!USE_API) return;
    setSaving(true);
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: form.type === 'shipping' ? 0 : Number(form.value) || 0,
        description: form.description.trim(),
        minOrder: Number(form.minOrder) || 0,
        maxUses: Number(form.maxUses) || 0,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      if (editing) {
        const { data } = await api.put(`/coupons/${editing._id}`, body);
        setCoupons((cs) => cs.map((c) => (c._id === data._id ? data : c)));
        toast.success('Cupón actualizado');
      } else {
        const { data } = await api.post('/coupons', body);
        setCoupons((cs) => [data, ...cs]);
        toast.success('Cupón creado');
      }
      closeForm();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo guardar el cupón');
    } finally { setSaving(false); }
  };

  const toggle = async (id) => {
    if (!USE_API) return;
    try {
      const { data } = await api.patch(`/coupons/${id}/toggle`);
      setCoupons((cs) => cs.map((c) => (c._id === id ? data : c)));
      toast.success(data.isActive ? 'Cupón activado' : 'Cupón desactivado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cambiar el estado');
    }
  };

  const openUses = async (c) => {
    setUsesLoading(true);
    setUsesModal({ code: c.code, orders: [] });
    try {
      const { data } = await api.get(`/coupons/admin/${c._id}/uses`);
      setUsesModal({ code: data.code, orders: data.orders });
    } catch {
      setUsesModal({ code: c.code, orders: [] });
    } finally { setUsesLoading(false); }
  };

  const remove = async (c) => {
    const ok = await askConfirm({
      title: 'Eliminar cupón',
      message: `¿Eliminar el cupón "${c.code}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/coupons/${c._id}`);
      setCoupons((cs) => cs.filter((x) => x._id !== c._id));
      toast.success('Cupón eliminado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar');
    }
  };

  const inputCls = 'w-full border border-cream-200 rounded-xl px-3 py-2.5 text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all bg-white';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 leading-none">Cupones</h1>
          <p className="text-ink-400 text-sm mt-1">
            {coupons.length === 0 ? 'Creá tu primer cupón' : `${coupons.filter((c) => c.isActive).length} activos de ${coupons.length}`}
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-btn whitespace-nowrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo cupón
        </button>
      </div>

      {!USE_API && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 text-sm">
          Los cupones requieren el backend activo (VITE_API_URL).
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-cream-100 animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-3xl mb-4">🎟️</div>
          <h3 className="font-display text-lg font-bold text-ink-900 mb-1">Aún no hay cupones</h3>
          <p className="text-sm text-ink-400 mb-5">Creá uno para ofrecer descuentos en el checkout.</p>
          <button onClick={openCreate}
            className="bg-ink-900 hover:bg-rose-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            Crear primer cupón
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {coupons.map((c) => {
            const info    = TYPE_LABELS[c.type] || TYPE_LABELS.percent;
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const used    = c.maxUses > 0 && c.usedCount >= c.maxUses;
            const disabled = !c.isActive || expired || used;

            return (
              <div key={c._id}
                className={`bg-white rounded-2xl border border-cream-100 shadow-card p-4 flex flex-col gap-3 ${disabled ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-base font-bold text-ink-900 tracking-wider">{c.code}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${info.tag}`}>{info.label}</span>
                      {!c.isActive && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ink-100 text-ink-500">Inactivo</span>}
                      {expired && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">Vencido</span>}
                      {used && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">Agotado</span>}
                    </div>
                    <p className="text-sm font-semibold text-ink-700 mt-1">{info.desc(c.value)}</p>
                    {c.description && <p className="text-xs text-ink-400 mt-0.5 line-clamp-1">{c.description}</p>}
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => openUses(c)} title="Ver usos"
                      className="p-2 text-ink-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </button>
                    <button onClick={() => toggle(c._id)} title={c.isActive ? 'Desactivar' : 'Activar'}
                      className={`p-2 rounded-lg transition-colors ${c.isActive ? 'text-green-600 hover:bg-green-50' : 'text-ink-400 hover:bg-ink-100'}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={c.isActive ? 'M20 6 9 17l-5-5' : 'M18 6 6 18M6 6l12 12'}/></svg>
                    </button>
                    <button onClick={() => openEdit(c)} title="Editar"
                      className="p-2 text-ink-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => remove(c)} title="Eliminar"
                      className="p-2 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-3 border-t border-cream-100">
                  <div>
                    <p className="text-ink-400 uppercase tracking-wider font-semibold">Usos</p>
                    <p className="text-ink-900 font-bold mt-0.5">{c.usedCount}{c.maxUses > 0 ? ` / ${c.maxUses}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-ink-400 uppercase tracking-wider font-semibold">Mín. pedido</p>
                    <p className="text-ink-900 font-bold mt-0.5">{c.minOrder > 0 ? formatCRC(c.minOrder) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-ink-400 uppercase tracking-wider font-semibold">Vence</p>
                    <p className="text-ink-900 font-bold mt-0.5">{c.expiresAt ? new Date(c.expiresAt).toLocaleString('es-CR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal usos */}
      <AnimatePresence>
        {usesModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setUsesModal(null)}
            className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="p-5 border-b border-cream-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink-900">Usos del cupón <span className="font-mono text-rose-500">{usesModal.code}</span></h3>
                  <p className="text-xs text-ink-400 mt-0.5">{usesLoading ? 'Cargando...' : `${usesModal.orders.length} pedido${usesModal.orders.length !== 1 ? 's' : ''}`}</p>
                </div>
                <button onClick={() => setUsesModal(null)} className="p-1.5 text-ink-400 hover:text-ink-900 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-4">
                {usesLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-cream-50 rounded-xl animate-pulse" />)}
                  </div>
                ) : usesModal.orders.length === 0 ? (
                  <div className="text-center py-10 text-ink-400 text-sm">Nadie ha usado este cupón todavía.</div>
                ) : (
                  <div className="space-y-2">
                    {usesModal.orders.map((o) => (
                      <div key={o._id} className="bg-cream-50 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink-900 truncate">{o.customer?.name}</p>
                          <p className="text-xs text-ink-400">{o.customer?.phone} · #{o.orderNumber}</p>
                          <p className="text-xs text-ink-400">{new Date(o.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-ink-900">{formatCRC(o.total)}</p>
                          <p className="text-xs text-green-600">−{formatCRC(o.discount || o.coupon?.discount || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeForm}
            className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSubmit}
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0,  opacity: 1, scale: 1 }}
              exit={{    y: 40, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-cream-100 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-ink-900">
                  {editing ? 'Editar cupón' : 'Nuevo cupón'}
                </h3>
                <button type="button" onClick={closeForm}
                  className="p-1.5 text-ink-400 hover:text-ink-900 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase tracking-wide mb-1.5">Código *</label>
                  <input required value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="PRIMERACOMPRA"
                    maxLength={20}
                    className={`${inputCls} font-mono tracking-wider uppercase`} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase tracking-wide mb-1.5">Tipo de descuento *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TYPE_LABELS).map(([key, info]) => (
                      <button key={key} type="button"
                        onClick={() => setForm((f) => ({ ...f, type: key }))}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                          form.type === key
                            ? 'border-rose-400 bg-rose-50 text-rose-600'
                            : 'border-cream-200 text-ink-500 hover:border-rose-200'
                        }`}>
                        {info.label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.type !== 'shipping' && (
                  <div>
                    <label className="block text-xs font-bold text-ink-500 uppercase tracking-wide mb-1.5">
                      {form.type === 'percent' ? 'Porcentaje (%)' : 'Monto fijo (CRC)'} *
                    </label>
                    <input required type="number" min="0" max={form.type === 'percent' ? 100 : undefined}
                      value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                      placeholder={form.type === 'percent' ? '10' : '2000'}
                      className={inputCls} />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase tracking-wide mb-1.5">Descripción</label>
                  <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Primera compra (se ve en el checkout)"
                    className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-500 uppercase tracking-wide mb-1.5">Pedido mínimo</label>
                    <input type="number" min="0" value={form.minOrder}
                      onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                      placeholder="0 = sin mínimo"
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-500 uppercase tracking-wide mb-1.5">Máx. usos</label>
                    <input type="number" min="0" value={form.maxUses}
                      onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                      placeholder="0 = ilimitado"
                      className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-500 uppercase tracking-wide mb-1.5">Fecha de vencimiento</label>
                  <input type="datetime-local" value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className={inputCls} />
                  <p className="text-[11px] text-ink-400 mt-1">Dejalo vacío si no vence.</p>
                </div>
              </div>

              <div className="p-6 border-t border-cream-100 flex gap-3">
                <button type="button" onClick={closeForm}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-ink-600 hover:bg-cream-100 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-50">
                  {saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Crear cupón')}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
