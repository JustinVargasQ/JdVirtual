import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { formatCRC } from '../../lib/currency';

const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const TrashIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const TagIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const FormIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;

/* ── Coupon input strip — validates against the real API ── */
function CouponStrip({ couponCode, couponDiscount, couponDesc, setCoupon, clearCoupon, subtotal }) {
  const [input,    setInput]   = useState('');
  const [open,     setOpen]    = useState(!!couponCode);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');

  const hasApi = !!import.meta.env.VITE_API_URL;

  const apply = async () => {
    const code = input.trim().toUpperCase();
    if (!code) return;
    if (!hasApi) {
      setError('Los cupones requieren conexión al servidor.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { default: api } = await import('../../lib/api');
      const { data } = await api.post('/coupons/validate', { code, subtotal });
      setCoupon(data.code, data.discount, data.description, data.type);
      setInput('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Cupón inválido o expirado';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const remove = () => {
    setInput('');
    setError('');
    clearCoupon();
  };

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
            /* ── Applied state ── */
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
                    {couponDesc && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">{couponDesc}</p>
                    )}
                  </div>
                </div>
                <button onClick={remove}
                  className="text-emerald-400 hover:text-red-500 transition-colors ml-2 p-1"
                  title="Quitar cupón">
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
            /* ── Input state ── */
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
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={apply}
                  disabled={!input.trim() || loading}
                  className="px-4 py-2 bg-ink-900 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap">
                  {loading ? (
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : 'Validar'}
                </motion.button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
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

/* ── Order progress tracker ── */
const STEPS = [
  { n: 1, label: 'Carrito\nlisto'      },
  { n: 2, label: 'Llenás el\nformulario' },
  { n: 3, label: 'Confirmás\nel pago'  },
];

function OrderProgress({ hasItems }) {
  const step = hasItems ? 2 : 1;

  return (
    <div className="px-6 py-4 border-b border-cream-200 bg-gradient-to-r from-cream-50 to-rose-50/30">
      <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-rose-500 mb-3">Progreso del pedido</p>
      <div className="flex items-start">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-start flex-1 min-w-0">
            {/* Step */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <motion.div
                animate={{
                  background: step > s.n
                    ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                    : step === s.n
                    ? 'linear-gradient(135deg,#B85F72,#93485A)'
                    : 'transparent',
                  borderColor: step >= s.n ? 'transparent' : '#e8ddd7',
                  color: step >= s.n ? '#fff' : '#a09490',
                  scale: step === s.n ? 1.12 : 1,
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-sm">
                {step > s.n ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : s.n}
              </motion.div>
              <span className="text-[9.5px] text-ink-400 text-center leading-tight whitespace-pre-line font-medium" style={{ maxWidth: 56 }}>
                {s.label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1.5 rounded-full bg-cream-200 mt-4 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#22c55e,#16a34a)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: step > s.n ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.15 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-cream-200">
              <div>
                <h2 className="font-display text-xl font-bold text-ink-900">Tu carrito</h2>
                {items.length > 0 && (
                  <p className="text-xs text-ink-400 mt-0.5">{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
                )}
              </div>
              <button onClick={closeCart} className="p-2 rounded-full hover:bg-cream-100 text-ink-500 transition-colors">
                <CloseIcon />
              </button>
            </div>

            {/* Progress bar */}
            <OrderProgress hasItems={items.length > 0} />

            {/* Items */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -4, 0] }}
                    transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-full bg-cream-100 flex items-center justify-center text-3xl">
                    🛍️
                  </motion.div>
                  <div>
                    <p className="font-semibold text-ink-700 mb-1">Tu carrito está vacío</p>
                    <p className="text-ink-400 text-sm">¡Agrega productos para empezar!</p>
                  </div>
                  <button onClick={closeCart}
                    className="mt-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm shadow-btn">
                    Explorar tienda
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
                        className="flex gap-4 bg-cream-50 rounded-2xl p-3 hover:bg-cream-100/60 transition-colors">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-sm">
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
                          className="text-ink-300 hover:text-rose-500 transition-colors self-start mt-1 p-1 flex-shrink-0 hover:scale-110">
                          <TrashIcon />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-cream-200 px-6 pt-5 pb-6 space-y-4 bg-white">
                {/* Coupon strip */}
                <CouponStrip
                  couponCode={couponCode}
                  couponDiscount={couponDiscount}
                  couponDesc={couponDesc}
                  setCoupon={setCoupon}
                  clearCoupon={clearCoupon}
                  subtotal={total}
                />

                {/* Totals */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-500">Subtotal</span>
                    <span className="font-semibold text-ink-700">{formatCRC(total)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between text-sm">
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <TagIcon /> Cupón <span className="font-mono font-bold">{couponCode}</span>
                      </span>
                      <span className="text-emerald-600 font-bold">−{formatCRC(couponDiscount)}</span>
                    </motion.div>
                  )}
                  <div className="flex items-center justify-between border-t border-cream-200 pt-2 mt-1">
                    <span className="font-bold text-ink-900">Total estimado</span>
                    <span className="font-bold text-xl text-ink-900">{formatCRC(finalTotal)}</span>
                  </div>
                </div>
                {/* Info sobre el proceso */}
                <div className="bg-cream-50 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400 flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <p className="text-[11px] text-ink-500 leading-relaxed">
                    Completá el formulario para registrar tu pedido. Te coordinamos el pago y envío por WhatsApp.
                  </p>
                </div>

                {/* CTA único — formulario */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/checkout"
                    onClick={closeCart}
                    className="w-full flex items-center justify-center gap-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-btn text-base">
                    <FormIcon />
                    Completar pedido
                  </Link>
                </motion.div>

                {/* Seguridad */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  {[
                    { icon: '🔒', label: 'Pago seguro' },
                    { icon: '📦', label: 'Pedido registrado' },
                    { icon: '💬', label: 'Coordinación WA' },
                  ].map((b) => (
                    <div key={b.label} className="flex items-center gap-1 text-[10px] text-ink-400 font-medium">
                      <span>{b.icon}</span>{b.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
