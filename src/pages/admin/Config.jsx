import { useState } from 'react';

export default function AdminConfig() {
  const [form, setForm] = useState({ whatsapp: '50688045100', heroTitle: 'Belleza auténtica', heroSub: 'Maquillaje y skincare de marcas originales.' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inputCls = 'w-full border border-cream-200 rounded-xl px-4 py-3 text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-rose-400 transition-colors bg-white';

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink-900 mb-8">Configuración</h1>
      <div className="max-w-xl bg-white rounded-xl2 shadow-card p-8 space-y-6">
        <div>
          <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Número WhatsApp</label>
          <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="50688045100" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Título del Hero</label>
          <input value={form.heroTitle} onChange={set('heroTitle')} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Subtítulo del Hero</label>
          <textarea value={form.heroSub} onChange={set('heroSub')} rows={2} className={inputCls + ' resize-none'} />
        </div>
        <button className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-btn">
          Guardar cambios
        </button>
        <p className="text-xs text-ink-400">Los cambios se aplican al conectar el backend.</p>
      </div>
    </div>
  );
}
