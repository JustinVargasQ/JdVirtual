import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import useWhatsApp from '../../hooks/useWhatsApp';
import { formatCRC } from '../../lib/currency';

const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const TrashIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const WaIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

/* ── Order progress tracker ── */
const STEPS = [
  { n: 1, label: 'Carrito\nlisto'      },
  { n: 2, label: 'Enviás el\npedido'   },
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
  const { items, isOpen, closeCart, removeItem, updateQty, total } = useCart();
  const { openOrder } = useWhatsApp();

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
              <div className="border-t border-cream-200 px-6 py-6 space-y-4 bg-white">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-700">Subtotal</span>
                  <span className="font-bold text-xl text-ink-900">{formatCRC(total)}</span>
                </div>
                <p className="text-xs text-ink-400">Envío coordinado por WhatsApp según tu provincia.</p>

                <motion.button
                  onClick={() => { openOrder(); closeCart(); }}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1db954] active:bg-green-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg text-base">
                  <WaIcon /> Pedir por WhatsApp
                </motion.button>

                <Link to="/checkout" onClick={closeCart}
                  className="w-full flex items-center justify-center border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white font-bold py-3.5 rounded-2xl transition-all duration-300 text-center text-sm">
                  Finalizar con formulario →
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
