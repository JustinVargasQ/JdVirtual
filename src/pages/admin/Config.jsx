import { useState, useEffect } from 'react';
import api from '../../lib/api';
import useToastStore from '../../store/toastStore';
import { formatCRC } from '../../lib/currency';

const USE_API = import.meta.env.VITE_API_URL;

const DEFAULTS = {
  storeName: 'JD Virtual',
  whatsapp: '50688045100',
  email: '',
  address: '',
  heroTitle: 'Belleza auténtica',
  heroSub: 'Maquillaje y skincare de marcas originales.',
  shippingCostCorreos: 2500,
  shippingCostExpress: 4500,
  freeShippingFrom: 25000,
  bankInfo: '',
};

const inputCls  = 'w-full border border-cream-200 rounded-xl px-4 py-2.5 text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all bg-white';
const labelCls  = 'block text-[11px] font-bold text-ink-500 uppercase tracking-widest mb-1.5';
const sectionCls = 'bg-white rounded-2xl border border-cream-100 shadow-card p-5 sm:p-6 space-y-4';

export default function AdminConfig() {
  const toast = useToastStore();
  const [form, setForm]       = useState(DEFAULTS);
  const [loading, setLoading] = useState(Boolean(USE_API));
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);

  useEffect(() => {
    if (!USE_API) return;
    (async () => {
      try {
        const { data } = await api.get('/settings');
        setForm({ ...DEFAULTS, ...data });
      } catch {
        toast.error('No se pudo cargar la configuración');
      } finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k) => (e) => {
    const v = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!USE_API) {
      toast.error('Backend no conectado (VITE_API_URL).');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.patch('/settings', form);
      setForm({ ...DEFAULTS, ...data });
      setDirty(false);
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo guardar');
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-10 text-center text-ink-400">Cargando configuración...</div>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 leading-none">Configuración</h1>
          <p className="text-ink-400 text-sm mt-1">Datos de tu tienda, envío y pagos</p>
        </div>
        <button type="submit" disabled={saving || !dirty}
          className="bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-btn">
          {saving ? 'Guardando...' : dirty ? 'Guardar cambios' : 'Sin cambios'}
        </button>
      </div>

      {!USE_API && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-4 py-3 text-sm">
          Backend no conectado. Los cambios no se guardarán hasta configurar <code className="font-mono">VITE_API_URL</code>.
        </div>
      )}

      {/* Tienda */}
      <div className={sectionCls}>
        <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">Datos de la tienda</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre</label>
            <input value={form.storeName} onChange={set('storeName')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>WhatsApp</label>
            <input value={form.whatsapp} onChange={set('whatsapp')} className={inputCls} placeholder="50688045100" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="contacto@tienda.com" />
          </div>
          <div>
            <label className={labelCls}>Dirección</label>
            <input value={form.address} onChange={set('address')} className={inputCls} placeholder="San José, Costa Rica" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className={sectionCls}>
        <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">Página principal</p>

        <div>
          <label className={labelCls}>Título del hero</label>
          <input value={form.heroTitle} onChange={set('heroTitle')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Subtítulo del hero</label>
          <textarea value={form.heroSub} onChange={set('heroSub')} rows={2} className={inputCls + ' resize-none'} />
        </div>
      </div>

      {/* Envío */}
      <div className={sectionCls}>
        <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">Envío</p>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Correos CR (₡)</label>
            <input type="number" min="0" value={form.shippingCostCorreos} onChange={set('shippingCostCorreos')} className={inputCls} />
            <p className="text-[11px] text-ink-400 mt-1">{formatCRC(form.shippingCostCorreos)}</p>
          </div>
          <div>
            <label className={labelCls}>Express (₡)</label>
            <input type="number" min="0" value={form.shippingCostExpress} onChange={set('shippingCostExpress')} className={inputCls} />
            <p className="text-[11px] text-ink-400 mt-1">{formatCRC(form.shippingCostExpress)}</p>
          </div>
          <div>
            <label className={labelCls}>Envío gratis desde (₡)</label>
            <input type="number" min="0" value={form.freeShippingFrom} onChange={set('freeShippingFrom')} className={inputCls} />
            <p className="text-[11px] text-ink-400 mt-1">{form.freeShippingFrom > 0 ? formatCRC(form.freeShippingFrom) : 'Desactivado'}</p>
          </div>
        </div>
      </div>

      {/* Pagos */}
      <div className={sectionCls}>
        <p className="text-xs font-bold text-ink-400 uppercase tracking-widest">Información de pago</p>

        <div>
          <label className={labelCls}>Datos bancarios / SINPE</label>
          <textarea value={form.bankInfo} onChange={set('bankInfo')} rows={4}
            className={inputCls + ' resize-none font-mono text-xs'}
            placeholder="SINPE Móvil: 8804-5100 (JD Virtual)&#10;BAC: CR12 3456 7890 1234 5678" />
          <p className="text-[11px] text-ink-400 mt-1">Esta información se enviará al cliente por WhatsApp al confirmar el pedido.</p>
        </div>
      </div>

      {dirty && (
        <div className="sticky bottom-4 bg-ink-900 text-white rounded-2xl px-5 py-3 flex items-center justify-between gap-3 shadow-xl">
          <span className="text-sm">Tenés cambios sin guardar</span>
          <button type="submit" disabled={saving}
            className="bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-btn">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </form>
  );
}
