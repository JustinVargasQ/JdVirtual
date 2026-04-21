import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import { formatCRC } from '../lib/currency';
import { buildWhatsAppMessage } from '../lib/whatsapp';
import AddressAutocomplete from '../components/ui/AddressAutocomplete';

const PROVINCES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
const SHIPPING = { correos: { label: 'Correos de CR (3-5 días)', price: 2500 }, express: { label: 'Express zona Puntarenas', price: 1500 }, pickup: { label: 'Retiro en El Roble (gratis)', price: 0 } };

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState('correos');
  const [form, setForm] = useState({ name: '', phone: '', province: 'Puntarenas', address: '', notes: '', lat: null, lng: null });

  const shippingCost = SHIPPING[shipping].price;
  const grandTotal = total + shippingCost;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAddressSelect = (parsed) => {
    setForm((f) => ({
      ...f,
      address: parsed.address,
      province: parsed.province || f.province,
      lat: parsed.lat,
      lng: parsed.lng,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = buildWhatsAppMessage(items, { ...form, shippingMethod: SHIPPING[shipping].label });
    window.open(url, '_blank', 'noopener');
    clearCart();
    navigate('/confirmacion');
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
                <div>
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Provincia *</label>
                  <select required value={form.province} onChange={set('province')} className={inputCls}>
                    {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Dirección exacta *</label>
                  <AddressAutocomplete
                    required
                    value={form.address}
                    onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                    onSelect={handleAddressSelect}
                    placeholder="Empezá a escribir tu dirección..."
                    className={inputCls}
                  />
                  {form.lat && (
                    <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Dirección verificada con Google Maps
                    </p>
                  )}
                </div>
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
                    <span className="font-bold text-ink-900">{val.price === 0 ? 'Gratis' : formatCRC(val.price)}</span>
                  </label>
                ))}
              </div>
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
              <div className="border-t border-cream-200 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatCRC(total)}</span></div>
                <div className="flex justify-between text-ink-600"><span>Envío</span><span>{shippingCost === 0 ? 'Gratis' : formatCRC(shippingCost)}</span></div>
                <div className="flex justify-between font-bold text-ink-900 text-base pt-2 border-t border-cream-200">
                  <span>Total</span><span>{formatCRC(grandTotal)}</span>
                </div>
              </div>
              <button type="submit"
                className="w-full mt-6 flex items-center justify-center gap-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl transition-colors text-base shadow-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Enviar pedido por WhatsApp
              </button>
              <p className="text-center text-xs text-ink-400 mt-3">Se abrirá WhatsApp con tu pedido completo</p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
