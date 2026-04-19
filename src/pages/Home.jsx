import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ui/ProductCard';
import FilterBar from '../components/ui/FilterBar';
import { useProducts, useFeatured, useCategoryPreviews } from '../hooks/useProducts';

/* ── Hero slide config (no images — come from real products) ── */
const SLIDE_CONFIG = [
  {
    tag: 'Nuevos ingresos',
    title: 'Tu nueva\nobsesión',
    sub: 'Maquillaje y skincare de marcas originales con envíos a todo Costa Rica.',
    cta: 'Ver catálogo',
    cat: null,
    bg: '#FDF2F5',
    accent: '#B85F72',
  },
  {
    tag: 'Skincare coreano',
    title: 'Cuida tu\npiel hoy',
    sub: 'Productos auténticos con resultados reales para tu rutina diaria.',
    cta: 'Ver skincare',
    cat: 'skincare',
    bg: '#EEF7FB',
    accent: '#3B82A0',
  },
  {
    tag: 'Maquillaje',
    title: 'Brilla con\ntu estilo',
    sub: 'Las marcas que amas al mejor precio en Costa Rica.',
    cta: 'Ver maquillaje',
    cat: 'maquillaje',
    bg: '#FBF6EE',
    accent: '#B8842A',
  },
];

const CATEGORIES = [
  { label: 'Skincare',   cat: 'skincare'   },
  { label: 'Maquillaje', cat: 'maquillaje' },
  { label: 'Labios',     cat: 'labios'     },
  { label: 'Ojos',       cat: 'ojos'       },
  { label: 'Rostro',     cat: 'rostro'     },
  { label: 'Cabello',    cat: 'cabello'    },
];

const TRUST = [
  { icon: '🚚', title: 'Envíos a todo CR',       sub: 'Correos, Uber, Express' },
  { icon: '✅', title: 'Originales 100%',         sub: 'Marcas auténticas' },
  { icon: '💬', title: 'Atención WhatsApp',       sub: 'Respuesta rápida' },
  { icon: '💳', title: 'SINPE / Transferencia',   sub: 'Pago seguro' },
];

const MARQUEE_BRANDS = ['Beauty Creations','The Ordinary','CeraVe','Italia Deluxe','ELF','Beau Visage','Amor Us','Mixsoon','Ushas','Amuse','Celavi','Kevin y Coco'];

const WaIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const ChevronIcon = ({ dir }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left' ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
  </svg>
);

/* ── Hero — split layout ── */
function Hero({ onCatSelect, categoryImages }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);

  // Build slides merging config with real product images
  const SLIDES = SLIDE_CONFIG.map((s) => ({
    ...s,
    img: s.cat ? categoryImages[s.cat] : (Object.values(categoryImages)[0] || ''),
  }));

  const total = SLIDES.length;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % total), 5500);
    return () => clearInterval(t);
  }, [paused, total]);

  const slide = SLIDES[current];
  const prev  = () => setCurrent((c) => (c - 1 + total) % total);
  const next  = () => setCurrent((c) => (c + 1) % total);

  return (
    <section
      className="relative overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: slide.bg, minHeight: '88vh' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-full grid md:grid-cols-2 gap-0 items-center"
        style={{ minHeight: '88vh' }}>

        {/* Left: Text */}
        <div className="flex flex-col justify-center py-20 md:py-0 z-10">
          <AnimatePresence mode="wait">
            <motion.div key={current}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.55, ease: [0.3, 1, 0.3, 1] }}>

              <span className="inline-block text-xs font-bold tracking-[0.22em] uppercase mb-5"
                style={{ color: slide.accent }}>
                {slide.tag}
              </span>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-none text-ink-900 mb-5 whitespace-pre-line">
                {slide.title}
              </h1>

              <p className="text-ink-500 text-lg leading-relaxed mb-8 max-w-md">{slide.sub}</p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onCatSelect(slide.cat)}
                  className="inline-flex items-center font-bold px-8 py-3.5 rounded-full text-white transition-all duration-300 shadow-btn hover:shadow-btn-hover hover:scale-[1.02]"
                  style={{ backgroundColor: slide.accent }}>
                  {slide.cta}
                </button>
                <a href="https://wa.me/50688045100" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1db954] text-white font-semibold px-6 py-3.5 rounded-full transition-colors">
                  <WaIcon /> Pedir ahora
                </a>
              </div>

              {/* Arrows + dots */}
              <div className="flex items-center gap-4 mt-12">
                <button onClick={prev}
                  className="w-10 h-10 rounded-full border-2 border-ink-200 hover:border-ink-700 flex items-center justify-center text-ink-600 hover:text-ink-900 transition-all">
                  <ChevronIcon dir="left" />
                </button>
                <div className="flex gap-2">
                  {SLIDES.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                      className={`transition-all duration-300 rounded-full ${i === current ? 'w-7 h-2.5 bg-ink-900' : 'w-2.5 h-2.5 bg-ink-300 hover:bg-ink-500'}`} />
                  ))}
                </div>
                <button onClick={next}
                  className="w-10 h-10 rounded-full border-2 border-ink-200 hover:border-ink-700 flex items-center justify-center text-ink-600 hover:text-ink-900 transition-all">
                  <ChevronIcon dir="right" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Image */}
        <div className="relative hidden md:flex items-end justify-center h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={slide.img}
              alt={slide.tag}
              initial={{ opacity: 0, scale: 1.06, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.97, x: -20 }}
              transition={{ duration: 0.65, ease: [0.3, 1, 0.3, 1] }}
              className="w-full h-full object-cover absolute inset-0"
              style={{ maxHeight: '88vh' }}
            />
          </AnimatePresence>
          {/* Fade into left */}
          <div className="absolute inset-y-0 left-0 w-24 z-10"
            style={{ background: `linear-gradient(to right, ${slide.bg}, transparent)` }} />
        </div>
      </div>
    </section>
  );
}

/* ── Marquee brands ── */
function BrandMarquee() {
  const doubled = [...MARQUEE_BRANDS, ...MARQUEE_BRANDS];
  return (
    <div className="bg-ink-900 py-3.5 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((b, i) => (
          <span key={i} className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.22em] mx-8 flex-shrink-0">
            {b} <span className="text-rose-400 ml-8">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Category chips — circular images from real products ── */
function CategoryRow({ onCatSelect, categoryImages }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-center gap-4 sm:gap-8 overflow-x-auto scrollbar-hide pb-2">
        {CATEGORIES.map((c, i) => {
          const img = categoryImages[c.cat];
          return (
            <motion.button
              key={c.cat}
              onClick={() => onCatSelect(c.cat)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.45, ease: [0.3,1,0.3,1] }}
              className="group flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-rose-400 transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-105 bg-cream-100 flex items-center justify-center">
                {img
                  ? <img src={img} alt={c.label} className="w-full h-full object-cover" loading="lazy" />
                  : <span className="text-2xl">{c.label[0]}</span>
                }
              </div>
              <span className="text-xs font-semibold text-ink-600 group-hover:text-rose-500 transition-colors">{c.label}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

/* ── Trust bar ── */
function TrustBar() {
  return (
    <div className="border-y border-cream-100 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {TRUST.map((t, i) => (
            <motion.div key={t.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="flex items-center gap-3">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="text-sm font-bold text-ink-900 leading-tight">{t.title}</p>
                <p className="text-xs text-ink-400 leading-tight">{t.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Featured row ── */
function FeaturedSection() {
  const products = useFeatured(4);
  if (!products.length) return null;
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="section-label">Lo más vendido</span>
            <h2 className="section-title">Favoritas del momento</h2>
          </div>
          <Link to="/?featured=true" className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors hidden sm:flex items-center gap-1">
            Ver todos <span className="text-base">→</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {products.map((p, i) => <ProductCard key={p.id || p._id} product={p} index={i} />)}
        </div>
      </div>
    </section>
  );
}

/* ── Promo banner ── */
function PromoBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 to-rose-700 text-white px-8 sm:px-14 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-2">Productos 100% originales</p>
          <h3 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
            Las marcas que amas,<br className="hidden sm:block" /> al mejor precio en CR
          </h3>
          <p className="text-white/75 text-sm mt-2">Envíos rápidos · SINPE y transferencia · Atención por WhatsApp</p>
        </div>
        <a href="https://wa.me/50688045100" target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-rose-600 font-bold px-7 py-3.5 rounded-full hover:bg-rose-50 transition-colors shadow-lg">
          <WaIcon /> Pedir por WhatsApp
        </a>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -right-4 -bottom-10 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
      </div>
    </section>
  );
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-cream-200">
      <div className="skeleton aspect-square" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-5 w-1/3 rounded mt-2" />
      </div>
    </div>
  );
}

/* ── Main catalog ── */
function Catalog({ externalCat, catalogRef }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [animKey, setAnimKey] = useState(0);

  // Single source of truth: URL params (no duplicate state)
  const cat   = searchParams.get('cat')   || 'todos';
  const brand = searchParams.get('brand') || '';
  const q     = searchParams.get('q')     || '';

  const applyFilter = (updates) => {
    setSearchParams((prev) => {
      const np = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) =>
        v && v !== 'todos' ? np.set(k, v) : np.delete(k)
      );
      return np;
    });
    setAnimKey((k) => k + 1);
  };

  // Accept external category changes (hero / category row clicks)
  useEffect(() => {
    if (!externalCat) return;
    applyFilter({ cat: externalCat });
  }, [externalCat]);

  const handleCat   = (c) => applyFilter({ cat: c });
  const handleBrand = (b) => applyFilter({ brand: b });

  const { products, loading } = useProducts({ cat, brand, q });

  const catLabel = {
    todos: 'Todos los productos', ojos: 'Ojos', labios: 'Labios',
    rostro: 'Rostro', skincare: 'Skincare', cabello: 'Cabello', maquillaje: 'Maquillaje',
  }[cat] || cat;

  return (
    <section ref={catalogRef} id="tienda" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="section-label">Catálogo</span>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="section-title mb-0">
                <AnimatePresence mode="wait">
                  <motion.span key={cat}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
                    className="block">{catLabel}</motion.span>
                </AnimatePresence>
              </h2>
              {cat !== 'todos' && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleCat('todos')}
                  className="text-xs bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white font-semibold px-3 py-1 rounded-full transition-colors mt-1">
                  × Limpiar
                </motion.button>
              )}
            </div>
          </div>
          {q && (
            <p className="text-ink-500 text-sm">
              Resultados para: <strong className="text-ink-900">"{q}"</strong>
            </p>
          )}
        </div>

        <FilterBar cat={cat} brand={brand} onCat={handleCat} onBrand={handleBrand} />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div key="empty"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center py-24">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-ink-400 text-lg font-medium">No encontramos productos con esos filtros.</p>
              <button onClick={() => handleCat('todos')} className="mt-5 text-rose-500 font-semibold hover:underline">
                Ver todos los productos
              </button>
            </motion.div>
          ) : (
            <motion.div key={`grid-${animKey}`}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.38, ease: [0.3,1,0.3,1] }}
              className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {products.map((p, i) => <ProductCard key={p.id || p._id} product={p} index={i} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ── About ── */
function AboutSection({ categoryImages }) {
  const imgs = Object.values(categoryImages).filter(Boolean);
  const img1 = imgs[0] || '';
  const img2 = imgs[1] || '';

  return (
    <section id="nosotras" className="bg-ink-900 text-white py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.3,1,0.3,1] }}>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-rose-400 mb-4 block">Nosotras</span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Tu tienda de<br /><em className="text-rose-400 not-italic">confianza</em> en CR
          </h2>
          <p className="text-white/70 leading-relaxed mb-4">
            Somos JD Virtual Store, desde El Roble, Puntarenas. Nos especializamos en maquillaje y skincare de marcas auténticas al mejor precio.
          </p>
          <p className="text-white/70 leading-relaxed mb-8">
            Cada producto es cuidadosamente seleccionado. Atendemos por WhatsApp con respuesta rápida y enviamos a toda Costa Rica.
          </p>
          <a href="https://wa.me/50688045100" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1db954] text-white font-bold px-7 py-3.5 rounded-full transition-colors">
            <WaIcon /> Escríbenos
          </a>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.3,1,0.3,1], delay: 0.15 }}
          className="grid grid-cols-2 gap-4">
          {img1 && <img src={img1} alt="" className="rounded-2xl object-cover aspect-square" />}
          {img2 && <img src={img2} alt="" className="rounded-2xl object-cover aspect-square mt-8" />}
          {!img1 && <div className="rounded-2xl bg-white/10 aspect-square" />}
          {!img2 && <div className="rounded-2xl bg-white/10 aspect-square mt-8" />}
        </motion.div>
      </div>
    </section>
  );
}

/* ── Shipping ── */
function ShippingSection() {
  const methods = [
    { icon: '📦', title: 'Correos de CR',       desc: '3–5 días hábiles a todo el país. Desde ₡2,000.' },
    { icon: '⚡', title: 'Express Puntarenas',  desc: 'Mismo día o siguiente en zona Puntarenas.' },
    { icon: '🤝', title: 'Retiro en El Roble',  desc: 'Gratis. Coordinamos lugar y hora por WhatsApp.' },
  ];
  return (
    <section id="envios" className="bg-cream-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-label">Envíos</span>
          <h2 className="section-title">Coordinamos tu entrega</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {methods.map((m, i) => (
            <motion.div key={m.title}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5, ease: [0.3,1,0.3,1] }}
              className="bg-white border border-cream-200 rounded-3xl p-8 text-center hover:border-rose-200 hover:shadow-card-hover transition-all duration-500">
              <div className="text-5xl mb-5">{m.icon}</div>
              <h3 className="font-display text-xl font-semibold text-ink-900 mb-3">{m.title}</h3>
              <p className="text-ink-500 text-sm leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Page ── */
export default function Home() {
  const [selectedCat, setSelectedCat] = useState(null);
  const catalogRef    = useRef(null);
  const categoryImages = useCategoryPreviews();

  const handleCatSelect = (cat) => {
    setSelectedCat(cat || 'todos');
    setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  useEffect(() => {
    const fn = (e) => handleCatSelect(e.detail);
    window.addEventListener('jd:selectcat', fn);
    return () => window.removeEventListener('jd:selectcat', fn);
  }, []);

  return (
    <main>
      <Hero onCatSelect={handleCatSelect} categoryImages={categoryImages} />
      <BrandMarquee />
      <TrustBar />
      <CategoryRow onCatSelect={handleCatSelect} categoryImages={categoryImages} />
      <FeaturedSection />
      <PromoBanner />
      <Catalog externalCat={selectedCat} catalogRef={catalogRef} />
      <AboutSection categoryImages={categoryImages} />
      <ShippingSection />
    </main>
  );
}
