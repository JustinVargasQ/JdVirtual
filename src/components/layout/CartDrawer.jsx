import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { formatCRC } from '../../lib/currency';

/* ── Icons ── */
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);
const TagIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const WaIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

/* ── Cómo funciona — banda informativa debajo del header ── */
function HowItWorks() {
  const steps = [
    { n: '1', icon: '📋', label: 'Llenás el formulario', sub: '~1 minuto' },
    { n: '2', icon: '💬', label: 'Te escribimos por WhatsApp', sub: 'Confirmamos tu pedido' },
    { n: '3', icon: '💳', label: 'Pagás por SINPE', sub: 'Rápido y seguro' },
  ];
  return (
    <div className="px-5 py-3.5 border-b border-green-100 bg-green-50/70">
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-green-700 mb-2.5 flex items-center gap-1.5">
        <WaIcon />
        Así funciona el pedido
      </p>
      <div className="flex items-start gap-1">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0 min-w-0 w-full">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-[10px] font-bold flex-shrink-0">
                {s.n}
              </div>
              <p className="text-[10px] font-semibold text-ink-700 text-center leading-tight">{s.label}</p>
              <p className="text-[9px] text-ink-400 text-center leading-tight">{s.sub}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="w-4 h-px bg-green-300 mt-3 flex-shrink-0 mx-0.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Coupon input strip — validates against the real API ── */
function CouponStrip({ couponCode, couponDiscount, couponDesc, setCoupon, clearCoupon, subtotal }) {
  const [input,   setInput]   = useState('');
  const [open,    setOpen]    = useState(!!couponCode);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const hasApi = !!import.meta.env.VITE_API_URL;

  const apply = async () => {
    const code = input.trim().toUpperCase();
    if (!code) return;
    if (!hasApi) { setError('Los cupones requieren conexión al servidor.'); return; }
    setLoading(true);
    setError('');
    try {
      const { default: api } = await import('../../lib/api');
      const { data } = await api.post('/coupons/validate', { code, subtotal });
      setCoupon(data.code, data.discount, data.description, data.type);
      setInput('');
    } catch (err) {
      setError(err.response?.data?.error || 'Cupón inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  const remove = () => { setInput(''); setError(''); clearCoupon(); };

  return (
    <div className="border-t border-cream-100 pt-3">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-rose-500 transition-colors w-full py-1">
          <TagIcon />
          <span>¿Tenés un cupón de descuento?</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      ) : (
        <AnimatePresence mode="wait">
          {couponCode ? (
            <motion.div key="saved"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600 flex-shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-700">Cupón aplicado:</span>
                      <span className="font-mono text-xs font-bold text-emerald-800 tracking-wider">{couponCode}</span>
                    </div>
                    {couponDesc && <p className="text-[10px] text-emerald-600 mt-0.5">{couponDesc}</p>}
                  </div>
                </div>
                <button onClick={remove} className="text-emerald-400 hover:text-red-500 transition-colors ml-2 p-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              {couponDiscount > 0 && (
                <div className="mt-2 pt-2 border-t border-emerald-200 flex justify-between text-xs font-semibold">
                  <span className="text-emerald-700">Descuento:</span>
                  <span className="text-emerald-700">−{formatCRC(couponDiscount)}</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="input"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-1.5">Código de descuento</p>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && apply()}
                  placeholder="TU-CÓDIGO"
                  maxLength={20}
                  disabled={loading}
                  className={`flex-1 font-mono text-sm font-bold tracking-wider bg-cream-50 border rounded-xl px-3 py-2 uppercase placeholder-ink-300 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                    error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-cream-200 focus:border-rose-400 focus:ring-rose-100'
                  }`}
                />
                <motion.button whileTap={{ scale: 0.95 }} onClick={apply}
                  disabled={!input.trim() || loading}
                  className="px-4 py-2 bg-ink-900 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap">
                  {loading
                    ? <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    : 'Validar'}
                </motion.button>
              </div>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

/* ── Main drawer ── */
export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, total,
          couponCode, couponDiscount, couponDesc, couponType,
          setCoupon, clearCoupon } = useCart();

  const finalTotal = Math.max(0, total - (couponDiscount || 0));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm"
            onClick={closeCart} />

          {/* Drawer */}
          <motion.div key="drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-modal flex flex-col">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
              <div className="flex items-center gap-3">
                {/* WA badge */}
                <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                  <WaIcon />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink-900 leading-tight">Tu pedido</h2>
                  <p className="text-[11px] text-green-600 font-semibold">
                    {items.length === 0
                      ? 'Agregá productos para continuar'
                      : `${items.length} ${items.length === 1 ? 'producto' : 'productos'} · se coordina por WhatsApp`}
                  </p>
                </div>
              </div>
              <button onClick={closeCart} className="p-2 rounded-full hover:bg-cream-100 text-ink-500 transition-colors">
                <CloseIcon />
              </button>
            </div>

            {/* ── Cómo funciona ── */}
            <HowItWorks />

            {/* ── Items ── */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -4, 0] }}
                    transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center text-3xl">
                    🛍️
                  </motion.div>
                  <div>
                    <p className="font-semibold text-ink-800 mb-1">Tu pedido está vacío</p>
                    <p className="text-ink-400 text-sm">Agregá productos y te los enviamos por WhatsApp.</p>
                  </div>
                  <button onClick={closeCart}
                    className="mt-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm shadow-btn">
                    Ver productos
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const img = item.img || item.images?.[0] || '';
                    return (
                      <motion.div key={item.id || item._id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-3 bg-cream-50 rounded-2xl p-3 hover:bg-cream-100/60 transition-colors">
                        <div className="w-18 h-18 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-sm" style={{ width: 72, height: 72 }}>
                          {img
                            ? <img src={img} alt={item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-cream-200" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink-900 leading-snug line-clamp-2">{item.name}</p>
                          <p className="text-xs text-ink-400 mb-2">{item.brand}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-cream-200 bg-white rounded-xl overflow-hidden shadow-sm">
                              <button onClick={() => updateQty(item.id || item._id, item.qty - 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 text-ink-700 transition-colors font-bold text-lg leading-none">−</button>
                              <span className="w-8 text-center text-sm font-bold text-ink-900">{item.qty}</span>
                              <button onClick={() => updateQty(item.id || item._id, item.qty + 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 text-ink-700 transition-colors font-bold text-lg leading-none">+</button>
                            </div>
                            <p className="font-bold text-ink-900 text-sm">{formatCRC(item.price * item.qty)}</p>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id || item._id)}
                          className="text-ink-300 hover:text-rose-500 transition-colors self-start mt-1 p-1 flex-shrink-0">
                          <TrashIcon />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* ── Footer ── */}
            {items.length > 0 && (
              <div className="border-t border-cream-200 px-5 pt-4 pb-5 space-y-3.5 bg-white">

                {/* Cupón */}
                <CouponStrip
                  couponCode={couponCode}
                  couponDiscount={couponDiscount}
                  couponDesc={couponDesc}
                  setCoupon={setCoupon}
                  clearCoupon={clearCoupon}
                  subtotal={total}
                />

                {/* Totales */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-500">Subtotal</span>
                    <span className="font-semibold text-ink-700">{formatCRC(total)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between text-sm">
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <TagIcon /> Cupón <span className="font-mono font-bold">{couponCode}</span>
                      </span>
                      <span className="text-emerald-600 font-bold">−{formatCRC(couponDiscount)}</span>
                    </motion.div>
                  )}
                  <div className="flex items-center justify-between border-t border-cream-200 pt-2">
                    <span className="font-bold text-ink-900">Total estimado</span>
                    <span className="font-bold text-xl text-ink-900">{formatCRC(finalTotal)}</span>
                  </div>
                </div>

                {/* CTA — verde WhatsApp, va al formulario */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/checkout"
                    onClick={closeCart}
                    className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1db954] active:bg-green-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg text-base">
                    <WaIcon />
                    Pedir por WhatsApp
                  </Link>
                </motion.div>

                {/* Nota bajo el botón */}
                <p className="text-center text-[11px] text-ink-400 leading-snug">
                  Llenás un formulario rápido · te confirmamos por WhatsApp · pagás por SINPE
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
