import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useCart from '../hooks/useCart';
import { formatCRC } from '../lib/currency';
import { buildWhatsAppMessage } from '../lib/whatsapp';
import MapAddressPicker from '../components/ui/MapAddressPicker';
import api from '../lib/api';
import { trackBeginCheckout, trackPurchase } from '../lib/analytics';

const USE_API    = import.meta.env.VITE_API_URL;
const MAPS_KEY   = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const PLACE_ID   = 'ChIJozibdVQxoI8R8UWRnLA1T6w';
const PROVINCES  = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
const SHIPPING   = { correos: { label: 'Correos de CR (3-5 días)', price: 2500 }, express: { label: 'Express zona Puntarenas', price: 1500 }, pickup: { label: 'Retiro en El Roble (gratis)', price: 0 } };
const isPickup   = (s) => s === 'pickup';

const SINPE_NUMBER = '8673-7114';
const SINPE_NAME   = 'Justin Vargas Quiros';

const PAYMENT_METHODS = {
  whatsapp: { label: 'Coordinar por WhatsApp',  sub: 'Te indicamos cómo pagar al confirmar' },
  sinpe:    { label: 'SINPE Movil',              sub: `${SINPE_NUMBER} · ${SINPE_NAME}` },
};

export default function Checkout() {
  const {
    items, total, clearCart,
    couponCode: cartCouponCode,
    couponDiscount: cartCouponDiscount,
    couponDesc: cartCouponDesc,
    couponType: cartCouponType,
    clearCoupon: clearCartCoupon,
  } = useCart();

  const navigate = useNavigate();
  const [shipping, setShipping] = useState('correos');
  const [payment, setPayment]   = useState('whatsapp');
  const [form, setForm] = useState({ name: '', phone: '', email: '', province: 'Puntarenas', address: '', notes: '', lat: null, lng: null });

  const [couponCode,   setCouponCode]   = useState('');
  /* Inicializar desde el cart store si el usuario ya aplicó un cupón en el drawer */
  const [coupon, setCoupon] = useState(() =>
    cartCouponCode
      ? { code: cartCouponCode, discount: cartCouponDiscount, description: cartCouponDesc, type: cartCouponType, freeShipping: cartCouponType === 'shipping' }
      : null
  );
  const [couponError,  setCouponError]  = useState('');
  const [couponLoading,setCouponLoading]= useState(false);

  const shippingCost  = coupon?.freeShipping ? 0 : SHIPPING[shipping].price;
  const discount      = coupon ? Math.min(coupon.discount || 0, total) : 0;
  const grandTotal    = Math.max(0, total - discount) + shippingCost;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAddressPick = ({ address, lat, lng }) => {
    setForm((f) => ({ ...f, address, lat, lng }));
  };

  const applyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    if (!USE_API) { setCouponError('Cupones requieren backend activo.'); return; }

    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', {
        code,
        subtotal: total,
        shippingCost: SHIPPING[shipping].price,
      });
      setCoupon(data);
      setCouponCode('');
    } catch (err) {
      setCouponError(err.response?.data?.error || 'No se pudo aplicar el cupón');
      setCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => { setCoupon(null); setCouponError(''); clearCartCoupon(); };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    trackBeginCheckout(items, grandTotal);

    const customerData = {
      ...form,
      shippingMethod: SHIPPING[shipping].label,
      shippingCost,
      coupon: coupon ? { code: coupon.code, discount, freeShipping: coupon.freeShipping } : null,
      paymentMethod: PAYMENT_METHODS[payment].label,
    };

    let orderNumber = null;

    if (USE_API) {
      setSubmitting(true);
      try {
        const payload = {
          customer: {
            name:     form.name,
            phone:    form.phone,
            email:    form.email || '',
            province: isPickup(shipping) ? 'Puntarenas' : form.province,
            address:  isPickup(shipping) ? 'Retiro en local — El Roble, Puntarenas' : form.address,
            notes:    form.notes || '',
            lat:      form.lat || null,
            lng:      form.lng || null,
          },
          items: items.map((i) => ({
            productId: i.id,
            name:      i.name,
            brand:     i.brand || '',
            price:     i.price,
            qty:       i.qty,
            image:     i.img || '',
          })),
          subtotal: total,
          shippingCost,
          shippingMethod: shipping,
          coupon: coupon ? { code: coupon.code, discount, freeShipping: coupon.freeShipping } : null,
        };
        const { data } = await api.post('/orders', payload);
        orderNumber = data.orderNumber;
        trackPurchase(data.orderNumber, items, grandTotal);
      } catch (err) {
        console.error('Error al crear pedido:', err?.response?.data || err?.message || err);
        // Continue opening WhatsApp even if backend fails
      } finally {
        setSubmitting(false);
      }
    }

    const url = buildWhatsAppMessage(items, customerData, orderNumber);
    window.open(url, '_blank', 'noopener');
    clearCart();
    navigate('/confirmacion', { state: { orderNumber } });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24">
        <p className="text-ink-400 text-lg">Tu carrito está vacío.</p>
        <Link to="/" className="text-rose-500 font-semibold hover:underline">Ver productos</Link>
      </div>
    );
  }

  const inputCls = 'w-full border border-cream-200 rounded-xl px-4 py-3 text-ink-900 placeholder-ink-300 focus:outline-none focus:border-rose-400 transition-colors bg-white text-sm';

  return (
    <main className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="text-sm text-ink-400 hover:text-rose-500 transition-colors">← Volver</Link>
          <h1 className="font-display text-4xl font-semibold text-ink-900 mt-4">Finalizar pedido</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px] gap-10">

          {/* Left — form */}
          <div className="space-y-8">
            {/* Contact */}
            <div className="bg-white rounded-xl2 p-6 shadow-card">
              <h2 className="font-display text-xl font-semibold text-ink-900 mb-5">Datos de contacto</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Nombre completo *</label>
                  <input required value={form.name} onChange={set('name')} placeholder="María García" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Teléfono / WhatsApp *</label>
                  <input required value={form.phone} onChange={set('phone')} placeholder="8804-5100" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">
                    Correo electrónico <span className="text-ink-300 normal-case font-normal">(opcional — para recibir confirmación)</span>
                  </label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="tucorreo@gmail.com" className={inputCls} />
                </div>
                {!isPickup(shipping) && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Provincia *</label>
                      <select required value={form.province} onChange={set('province')} className={inputCls}>
                        {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Dirección exacta *</label>
                      <MapAddressPicker
                        required
                        value={form.address}
                        onChange={(v) => setForm((f) => ({ ...f, address: v, lat: null, lng: null }))}
                        onPick={handleAddressPick}
                        placeholder="Ciudad, barrio, señas — o tocá 📍 Mapa"
                        className={inputCls}
                      />
                      <p className="text-[11px] text-ink-400 mt-1">
                        Tip: tocá <span className="font-semibold text-rose-500">📍 Mapa</span> para marcar tu ubicación exacta en el mapa.
                      </p>
                    </div>
                  </>
                )}

                {isPickup(shipping) && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Ubicación del local</label>
                    <div className="rounded-xl overflow-hidden border border-cream-200 shadow-sm">
                      {/* Street View */}
                      {MAPS_KEY ? (
                        <div className="relative">
                          <iframe
                            title="Vista del local JD Virtual"
                            width="100%"
                            height="260"
                            style={{ border: 0, display: 'block' }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=place_id:${PLACE_ID}&maptype=roadmap&zoom=17`}
                          />
                        </div>
                      ) : (
                        <div className="h-40 bg-cream-100 flex items-center justify-center text-ink-400 text-sm">Mapa no disponible</div>
                      )}
                      <div className="bg-cream-50 px-4 py-3 flex items-start gap-3">
                        <span className="text-lg mt-0.5">📍</span>
                        <div>
                          <p className="text-sm font-semibold text-ink-900">JD Virtual Store — El Roble, Puntarenas</p>
                          <p className="text-xs text-ink-400 mt-0.5">Te coordinaremos el punto exacto por WhatsApp · Lun–Sáb 9am–7pm</p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=place_id:${PLACE_ID}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-rose-500 font-semibold hover:underline mt-1 inline-block">
                            Abrir en Google Maps →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Notas adicionales</label>
                  <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Color, talla, preferencias..." className={inputCls + ' resize-none'} />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-xl2 p-6 shadow-card">
              <h2 className="font-display text-xl font-semibold text-ink-900 mb-5">Método de envío</h2>
              <div className="space-y-3">
                {Object.entries(SHIPPING).map(([key, val]) => (
                  <label key={key} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${shipping === key ? 'border-rose-400 bg-rose-50' : 'border-cream-200 hover:border-rose-200'}`}>
                    <input type="radio" name="shipping" value={key} checked={shipping === key} onChange={() => setShipping(key)} className="accent-rose-500" />
                    <span className="flex-1 text-sm font-medium text-ink-800">{val.label}</span>
                    <span className="font-bold text-ink-900">
                      {coupon?.freeShipping && key !== 'pickup'
                        ? <><span className="text-ink-300 line-through mr-1 text-xs">{formatCRC(val.price)}</span><span className="text-green-600">Gratis</span></>
                        : (val.price === 0 ? 'Gratis' : formatCRC(val.price))}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {/* Payment */}
            <div className="bg-white rounded-xl2 p-6 shadow-card">
              <h2 className="font-display text-xl font-semibold text-ink-900 mb-5">Método de pago</h2>
              <div className="space-y-3">
                {Object.entries(PAYMENT_METHODS).map(([key, val]) => (
                  <label key={key} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${payment === key ? 'border-rose-400 bg-rose-50' : 'border-cream-200 hover:border-rose-200'}`}>
                    <input type="radio" name="payment" value={key} checked={payment === key} onChange={() => setPayment(key)} className="accent-rose-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-800">{val.label}</p>
                      <p className="text-xs text-ink-400 mt-0.5">{val.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
              {payment === 'sinpe' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1">Datos de SINPE Movil</p>
                  <p className="text-sm font-bold text-green-900">{SINPE_NUMBER}</p>
                  <p className="text-xs text-green-700">{SINPE_NAME}</p>
                  <p className="text-xs text-green-600 mt-2">Envia el comprobante por WhatsApp despues de realizar el pago.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right — summary */}
          <div>
            <div className="bg-white rounded-xl2 p-6 shadow-card sticky top-24">
              <h2 className="font-display text-xl font-semibold text-ink-900 mb-5">Resumen</h2>
              <div className="space-y-3 mb-5">
                {items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3">
                    <img src={i.img} alt={i.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink-900 truncate">{i.name}</p>
                      <p className="text-xs text-ink-400">× {i.qty}</p>
                    </div>
                    <p className="text-sm font-semibold text-ink-900">{formatCRC(i.price * i.qty)}</p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="border-t border-cream-200 pt-4 mb-4">
                <AnimatePresence mode="wait">
                  {coupon ? (
                    <motion.div key="applied"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                          <span className="font-mono font-bold text-sm text-green-700 truncate">{coupon.code}</span>
                        </div>
                        {coupon.description && (
                          <p className="text-[11px] text-green-700/70 mt-0.5 truncate">{coupon.description}</p>
                        )}
                      </div>
                      <button type="button" onClick={removeCoupon}
                        aria-label="Quitar cupón"
                        className="text-green-700/60 hover:text-red-500 transition-colors flex-shrink-0 p-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="input"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                          placeholder="Código de cupón"
                          className="flex-1 border border-cream-200 rounded-xl px-3 py-2.5 text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-rose-400 transition-colors font-mono uppercase tracking-wider"
                        />
                        <button type="button" onClick={applyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-ink-900 text-white hover:bg-rose-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                          {couponLoading ? '...' : 'Aplicar'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-red-500 mt-1.5">{couponError}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-cream-200 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatCRC(total)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({coupon.code})</span>
                    <span>−{formatCRC(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-600">
                  <span>Envío</span>
                  <span>
                    {coupon?.freeShipping && SHIPPING[shipping].price > 0
                      ? <><span className="line-through text-ink-300 mr-1">{formatCRC(SHIPPING[shipping].price)}</span><span className="text-green-600">Gratis</span></>
                      : (shippingCost === 0 ? 'Gratis' : formatCRC(shippingCost))}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-ink-900 text-base pt-2 border-t border-cream-200">
                  <span>Total</span><span>{formatCRC(grandTotal)}</span>
                </div>
              </div>
              <button type="submit"
                disabled={submitting}
                className="w-full mt-6 flex items-center justify-center gap-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors text-base shadow-btn">
                {submitting ? (
                  <>
                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Registrando pedido...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Enviar pedido por WhatsApp
                  </>
                )}
              </button>
              <p className="text-center text-xs text-ink-400 mt-3">Se abrirá WhatsApp con tu pedido completo</p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
