import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct, useProducts } from '../hooks/useProducts';
import useCart from '../hooks/useCart';
import useWhatsApp from '../hooks/useWhatsApp';
import { formatCRC } from '../lib/currency';
import ProductCard from '../components/ui/ProductCard';

/* ── Icons ── */
const StarIcon = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className={filled ? 'text-amber-400' : 'text-ink-200'}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500 flex-shrink-0 mt-0.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const WaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const TruckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const StarBadgeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const ZoomIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

function getDeliveryRange() {
  const today = new Date();
  const from = new Date(today); from.setDate(today.getDate() + 3);
  const to   = new Date(today); to.setDate(today.getDate() + 6);
  const fmt = (d) => `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
  return `${fmt(from)} - ${fmt(to)}`;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { product, loading } = useProduct(slug);
  const { addItem, openCart } = useCart();
  const { openOrder } = useWhatsApp();
  const [qty, setQty]         = useState(1);
  const [added, setAdded]     = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [zoomed, setZoomed]   = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [slug]);

  const cat = product?.cat || 'todos';
  const { products: related } = useProducts({ cat });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24">
        <p className="text-ink-400 text-lg">Producto no encontrado.</p>
        <Link to="/" className="text-rose-500 font-semibold hover:underline">Volver a la tienda</Link>
      </div>
    );
  }

  const images   = product.images?.length ? product.images : [product.img].filter(Boolean);
  const mainImg  = images[activeImg] || images[0] || '';
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const relatedProducts = related.filter((p) => p.slug !== slug).slice(0, 6);
  const deliveryRange = getDeliveryRange();

  const handleAdd = () => {
    addItem(product, qty);
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyWa = () => {
    addItem(product, qty);
    openOrder();
  };

  return (
    <main className="pt-24 pb-20 bg-white">

      {/* ── Main product section ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-ink-400 mb-8 flex-wrap">
          <Link to="/" className="hover:text-rose-500 transition-colors">Tienda</Link>
          <span className="text-ink-200">/</span>
          <Link to={`/?cat=${product.cat}`} className="hover:text-rose-500 transition-colors capitalize">{product.cat}</Link>
          <span className="text-ink-200">/</span>
          <span className="text-ink-600 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* ── Left: Image gallery ── */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2 w-[70px] flex-shrink-0">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-[70px] h-[70px] rounded-xl overflow-hidden border-2 transition-all duration-200 ${activeImg === i ? 'border-rose-400 shadow-md' : 'border-cream-200 opacity-70 hover:opacity-100'}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="relative flex-1 group">
              <div
                className="aspect-square bg-cream-50 rounded-2xl overflow-hidden cursor-zoom-in shadow-sm"
                onClick={() => setZoomed(true)}>
                <img src={mainImg} alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>

              {/* Zoom button */}
              <button onClick={() => setZoomed(true)}
                className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-ink-600 hover:text-rose-500 shadow transition-all opacity-0 group-hover:opacity-100">
                <ZoomIcon />
              </button>

              {/* Badges */}
              {discount > 0 && (
                <span className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  -{discount}%
                </span>
              )}
              {product.badge && !discount && (
                <span className="absolute top-3 left-3 bg-ink-900 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          {/* ── Right: Product info ── */}
          <div className="flex flex-col">

            {/* Delivery estimate */}
            <div className="flex items-center gap-2 text-sm font-medium text-ink-600 bg-cream-50 border border-cream-200 rounded-xl px-4 py-2.5 mb-5 w-fit">
              <TruckIcon />
              <span>Entrega estimada <strong className="text-ink-900">{deliveryRange}</strong></span>
            </div>

            {/* Brand + Name */}
            <p className="text-rose-500 font-semibold text-xs tracking-widest uppercase mb-1.5">{product.brand || 'JD Virtual'}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink-900 leading-snug mb-3">{product.name}</h1>

            {/* Rating */}
            {product.reviews > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">{[1,2,3,4,5].map((s) => <StarIcon key={s} filled={s <= Math.round(product.rating)} />)}</div>
                <span className="font-semibold text-sm text-ink-700">{product.rating}</span>
                <span className="text-ink-400 text-sm">({product.reviews} reseñas)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-1">
              <span className="font-display text-4xl font-bold text-ink-900">{formatCRC(product.price)}</span>
              {product.oldPrice && (
                <span className="text-lg text-ink-400 line-through">{formatCRC(product.oldPrice)}</span>
              )}
              {discount > 0 && (
                <span className="text-sm font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">-{discount}%</span>
              )}
            </div>
            <p className="text-xs text-ink-400 mb-5">Impuestos incluidos · Envío coordinado</p>

            {/* Stock urgency */}
            {product.stock > 0 && product.stock <= 10 && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-emerald-600 mb-1.5">
                  Date prisa, solo quedan {product.stock} artículo{product.stock !== 1 ? 's' : ''} en stock.
                </p>
                <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (product.stock / 10) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-ink-500 text-sm leading-relaxed mb-5">{product.description}</p>
            )}

            {/* Features */}
            {product.features?.length > 0 && (
              <ul className="space-y-1.5 mb-5">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                    <CheckIcon /> {f}
                  </li>
                ))}
              </ul>
            )}

            {/* Qty + CTA */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-cream-200 rounded-xl overflow-hidden bg-cream-50">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-11 flex items-center justify-center hover:bg-cream-100 text-ink-600 transition-colors text-xl font-light">−</button>
                <span className="w-10 text-center font-semibold text-ink-900 text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  className="w-10 h-11 flex items-center justify-center hover:bg-cream-100 text-ink-600 transition-colors text-xl font-light">+</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button onClick={handleAdd}
                className={`flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${added ? 'bg-emerald-500 text-white scale-[0.98]' : 'bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white shadow-btn'}`}>
                {added ? '✓ Agregado al carrito' : 'Añadir a la cesta'}
              </button>
              <button onClick={handleBuyWa}
                className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1db954] active:scale-[0.98] text-white font-semibold text-sm py-3.5 rounded-xl transition-all duration-200">
                <WaIcon /> Comprar por WhatsApp
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 border-t border-cream-100 pt-5">
              {[
                { icon: <ShieldIcon />,    label: 'Pago seguro' },
                { icon: <StarBadgeIcon />, label: 'Producto original' },
                { icon: <TruckIcon />,     label: 'Envío coordinado' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-rose-400">{icon}</span>
                  <span className="text-[11px] text-ink-500 font-medium leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Related products ── */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 bg-cream-50 py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-semibold text-ink-900 mb-8 text-center">
              También te puede gustar&hellip;
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id || p.slug} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Zoom lightbox ── */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}>
          <img src={mainImg} alt={product.name}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()} />
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-xl transition-colors">
            ×
          </button>
        </div>
      )}
    </main>
  );
}
