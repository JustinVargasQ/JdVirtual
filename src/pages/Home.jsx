import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import ProductCard from '../components/ui/ProductCard';
import FilterBar from '../components/ui/FilterBar';
import { useProducts, useFeatured, useCategoryPreviews } from '../hooks/useProducts';

/* ─── Slide config ─── */
const SLIDE_CONFIG = [
  {
    tag: '✨ Nuevos ingresos',
    title: 'Tu nueva\nobsesión',
    sub:  'Maquillaje y skincare de marcas originales con envíos a todo Costa Rica.',
    cta:  'Ver catálogo',
    cat:  null,
  },
  {
    tag: '🌿 Skincare coreano',
    title: 'Cuida tu\npiel hoy',
    sub:  'Productos auténticos con resultados reales para tu rutina diaria.',
    cta:  'Ver skincare',
    cat:  'skincare',
  },
  {
    tag: '💄 Maquillaje',
    title: 'Brilla con\ntu estilo',
    sub:  'Las marcas que amas al mejor precio en Costa Rica.',
    cta:  'Ver maquillaje',
    cat:  'maquillaje',
  },
];

const CATEGORIES = [
  { label: 'Skin care',  cat: 'skincare',   img: '/imgs/Skincare.jpeg'   },
  { label: 'Maquillaje', cat: 'maquillaje', img: '/imgs/Maquillaje.jpeg' },
  { label: 'Accesorios', cat: 'accesorios', img: '/imgs/Accesorios.jpeg' },
  { label: 'Perfumes',   cat: 'perfumes',   img: '/imgs/Perfume.jpeg'    },
  { label: 'Cabello',    cat: 'cabello',    img: '/imgs/Cabello.jpeg'    },
];

const TRUST = [
  { emoji: '🚚', title: 'Envíos a todo CR',     sub: 'Correos, Uber, Express' },
  { emoji: '✅', title: 'Originales 100%',       sub: 'Marcas auténticas' },
  { emoji: '💬', title: 'Atención WhatsApp',     sub: 'Respuesta rápida' },
  { emoji: '💳', title: 'SINPE / Transferencia', sub: 'Pago seguro' },
];

const MARQUEE_BRANDS = [
  'Beauty Creations','The Ordinary','CeraVe','Italia Deluxe','ELF',
  'Beau Visage','Amor Us','Mixsoon','Ushas','Amuse','Celavi','Kevin y Coco',
];

/* ─── Icons ─── */
const WaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const ChevronIcon = ({ dir }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left' ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
  </svg>
);

const BoxIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>;
const ZapIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const HandshakeIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/><path d="m9 12 2 2 4-4"/></svg>;

/* ─── Animated count-up number ─── */
function CountNum({ to, duration = 1.8, delay = 0.5 }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  useEffect(() => {
    const ctrl = animate(count, to, { duration, ease: 'easeOut', delay });
    return ctrl.stop;
  }, [to]);
  return <motion.span>{rounded}</motion.span>;
}

/* ─── Sparkle particles ─── */
const SPARKLE_DEFS = [
  { x: '7%',  y: '70%', s: 4, d: '0s',    t: '3.3s' },
  { x: '15%', y: '58%', s: 3, d: '0.8s',  t: '2.9s' },
  { x: '25%', y: '78%', s: 5, d: '1.4s',  t: '3.7s' },
  { x: '34%', y: '52%', s: 3, d: '0.3s',  t: '2.6s' },
  { x: '46%', y: '72%', s: 4, d: '2.1s',  t: '3.1s' },
  { x: '55%', y: '63%', s: 3, d: '1.0s',  t: '2.8s' },
  { x: '64%', y: '80%', s: 5, d: '0.2s',  t: '3.6s' },
  { x: '73%', y: '55%', s: 3, d: '1.7s',  t: '2.7s' },
  { x: '81%', y: '68%', s: 4, d: '0.9s',  t: '3.2s' },
  { x: '89%', y: '83%', s: 3, d: '2.3s',  t: '2.5s' },
  { x: '20%', y: '38%', s: 4, d: '1.6s',  t: '4.1s' },
  { x: '68%', y: '42%', s: 3, d: '0.6s',  t: '3.4s' },
  { x: '42%', y: '30%', s: 4, d: '2.6s',  t: '3.9s' },
  { x: '88%', y: '35%', s: 3, d: '1.2s',  t: '3.0s' },
];

const STAR_DEFS = [
  { x: '18%', y: '28%', d: '1.3s', t: '4.8s' },
  { x: '74%', y: '22%', d: '2.7s', t: '5.2s' },
  { x: '50%', y: '18%', d: '0.4s', t: '4.0s' },
  { x: '32%', y: '45%', d: '3.0s', t: '4.5s' },
];

function SparkleParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-[5]">
      {SPARKLE_DEFS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/75"
          style={{
            left: s.x, top: s.y,
            width: s.s, height: s.s,
            animationName: 'sparkle-float',
            animationDuration: s.t,
            animationDelay: s.d,
            animationTimingFunction: 'ease-out',
            animationIterationCount: 'infinite',
          }}
        />
      ))}
      {STAR_DEFS.map((s, i) => (
        <div
          key={`star-${i}`}
          className="absolute text-white/50 text-xs select-none"
          style={{
            left: s.x, top: s.y,
            animationName: 'sparkle-float',
            animationDuration: s.t,
            animationDelay: s.d,
            animationTimingFunction: 'ease-out',
            animationIterationCount: 'infinite',
          }}>
          ✦
        </div>
      ))}
    </div>
  );
}

/* ─── Hero ─── */
function Hero({ onCatSelect, categoryImages }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);

  const SLIDES = SLIDE_CONFIG.map((s) => ({
    ...s,
    img: s.cat ? categoryImages[s.cat] : (Object.values(categoryImages)[0] || ''),
  }));
  const total = SLIDES.length;
  const slide = SLIDES[current];

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % total), 5500);
    return () => clearInterval(t);
  }, [paused, total]);

  const prev = () => { setPaused(true); setCurrent((c) => (c - 1 + total) % total); };
  const next = () => { setPaused(true); setCurrent((c) => (c + 1) % total); };

  return (
    <section
      className="relative flex flex-col justify-end overflow-hidden"
      style={{ minHeight: '100svh' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      {/* Background image — crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${current}`}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: [0.3, 1, 0.3, 1] }}>
          <img
            src={slide.img}
            alt={slide.tag}
            className="w-full h-full object-cover object-center"
            style={{ minHeight: '100svh' }}
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(18,10,12,0.97) 0%, rgba(18,10,12,0.65) 38%, rgba(18,10,12,0.22) 65%, rgba(18,10,12,0.35) 100%)' }} />
          {/* Rose tint at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-80"
            style={{ background: 'linear-gradient(to top, rgba(184,95,114,0.28), transparent)' }} />
        </motion.div>
      </AnimatePresence>

      {/* Floating sparkle particles */}
      <SparkleParticles />

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute top-[10%] right-[5%] w-72 h-72 sm:w-[28rem] sm:h-[28rem] rounded-full bg-rose-500/18 blur-3xl animate-orb-pulse" />
      <div className="pointer-events-none absolute top-[50%] left-[2%] w-48 h-48 sm:w-72 sm:h-72 rounded-full bg-rose-300/12 blur-3xl animate-orb-pulse" style={{ animationDelay: '2.5s' }} />
      <div className="pointer-events-none absolute bottom-[15%] right-[25%] w-40 h-40 rounded-full bg-[#C9A875]/12 blur-2xl animate-orb-pulse" style={{ animationDelay: '1.2s' }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-20 sm:pb-28 pt-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.65, ease: [0.3, 1, 0.3, 1] }}>

            {/* Pill badge — breathe animation */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.55 }}
              className="mb-6">
              <span
                className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full text-white border border-white/20 animate-breathe"
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(14px)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                {slide.tag}
              </span>
            </motion.div>

            {/* Headline — animated shimmer gradient */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.65 }}
              className="font-display font-bold leading-[0.95] whitespace-pre-line mb-6 text-gradient-hero drop-shadow-2xl"
              style={{ fontSize: 'clamp(3.2rem, 12vw, 8rem)' }}>
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.55 }}
              className="text-white/72 text-base sm:text-lg leading-relaxed mb-9 max-w-md">
              {slide.sub}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.5 }}
              className="flex flex-wrap gap-3 mb-12">
              <button
                onClick={() => onCatSelect(slide.cat)}
                className="group inline-flex items-center gap-2 font-bold text-sm sm:text-base px-8 py-4 rounded-full text-ink-900 bg-white hover:bg-rose-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.04] active:scale-[0.98]">
                {slide.cta}
                <span className="group-hover:translate-x-1.5 transition-transform duration-300 text-lg">→</span>
              </button>
              <a href="https://wa.me/50688045100" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold text-sm sm:text-base px-8 py-4 rounded-full text-white bg-[#25D366] hover:bg-[#1db954] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.04] active:scale-[0.98]">
                <WaIcon /> Pedir ahora
              </a>
            </motion.div>

            {/* Stats — count-up on each slide change */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.55 }}
              className="flex items-center gap-6 sm:gap-8 flex-wrap">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white leading-none tabular-nums">
                  <CountNum to={1000} duration={2} delay={0.8} />+
                </p>
                <p className="text-[11px] text-white/55 mt-1 uppercase tracking-wider">Clientas felices</p>
              </div>
              <div className="w-px h-10 bg-white/20 hidden sm:block" />
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white leading-none tabular-nums">
                  <CountNum to={50} duration={1.5} delay={0.9} />+
                </p>
                <p className="text-[11px] text-white/55 mt-1 uppercase tracking-wider">Marcas originales</p>
              </div>
              <div className="w-px h-10 bg-white/20 hidden sm:block" />
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white leading-none">CR</p>
                <p className="text-[11px] text-white/55 mt-1 uppercase tracking-wider">Todo el país</p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Slide controls */}
        <div className="absolute bottom-7 right-5 sm:right-8 flex items-center gap-2.5 z-20">
          <button onClick={prev}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white border border-white/25 hover:border-white/60 transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
            <ChevronIcon dir="left" />
          </button>
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => { setPaused(true); setCurrent(i); }}
                className={`rounded-full transition-all duration-400 ${i === current ? 'w-7 h-2 bg-white' : 'w-2 h-2 bg-white/35 hover:bg-white/65'}`} />
            ))}
          </div>
          <button onClick={next}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white border border-white/25 hover:border-white/60 transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
            <ChevronIcon dir="right" />
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 pointer-events-none">
        <p className="text-white/35 text-[10px] uppercase tracking-[0.25em]">scroll</p>
        <motion.div
          className="w-px h-7 rounded-full bg-white/40"
          animate={{ scaleY: [0.6, 1, 0.6], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </section>
  );
}

/* ─── Trust bar — dark tiles ─── */
function TrustBar() {
  return (
    <div className="bg-ink-900 py-5 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {TRUST.map((t, i) => (
            <motion.div key={t.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: [0.3, 1, 0.3, 1] }}
              whileHover={{ scale: 1.04 }}
              className="flex items-center gap-3 cursor-default">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: 'rgba(209,125,141,0.15)' }}>
                {t.emoji}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{t.title}</p>
                <p className="text-[11px] text-white/40 leading-tight mt-0.5">{t.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Brand marquee — with edge fades ─── */
function BrandMarquee() {
  const doubled = [...MARQUEE_BRANDS, ...MARQUEE_BRANDS];
  return (
    <div className="relative bg-ink-900 border-t border-white/5 py-3.5 overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10"
        style={{ background: 'linear-gradient(to right, #1A1414, transparent)' }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10"
        style={{ background: 'linear-gradient(to left, #1A1414, transparent)' }} />
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((b, i) => (
          <span key={i} className="text-rose-400/65 text-[11px] font-semibold uppercase tracking-[0.22em] mx-7 flex-shrink-0">
            {b} <span className="text-rose-600/50 ml-7">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Category stories row ─── */
function CategoryRow({ onCatSelect }) {
  return (
    <section className="py-10 sm:py-14 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}>
          <span className="section-label">Categorías</span>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 leading-tight animated-underline">
            ¿Qué buscás hoy?
          </h2>
        </motion.div>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-start gap-5 sm:gap-8 px-4 sm:px-6 lg:px-8 pb-2 w-max sm:w-full sm:justify-center mx-auto">
          {CATEGORIES.map((c, i) => (
            <motion.button
              key={c.cat}
              onClick={() => onCatSelect(c.cat)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.3, 1, 0.3, 1] }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="group flex flex-col items-center gap-3 flex-shrink-0 w-20 sm:w-26">
              <div className="relative w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-rose-400 group-hover:ring-offset-3 transition-all duration-300 shadow-md group-hover:shadow-lg">
                <img src={c.img} alt={c.label} className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-[10px] font-bold tracking-wide">Ver →</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-ink-600 group-hover:text-rose-500 transition-colors text-center leading-tight">{c.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Featured section ─── */
function FeaturedSection() {
  const products = useFeatured(4);
  if (!products.length) return null;

  return (
    <section className="py-14 sm:py-20 bg-cream-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="flex items-end justify-between mb-8">
          <div>
            <span className="section-label">🔥 Tendencias</span>
            <h2 className="section-title animated-underline">Favoritas del momento</h2>
          </div>
          <Link to="/?featured=true"
            className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors hidden sm:flex items-center gap-1 group">
            Ver todos
            <span className="group-hover:translate-x-1 transition-transform duration-200 text-base">→</span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {products.map((p, i) => (
            <motion.div
              key={p.id || p._id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.3, 1, 0.3, 1] }}>
              <ProductCard product={p} index={i} />
            </motion.div>
          ))}
        </div>

        <div className="mt-6 sm:hidden flex justify-center">
          <Link to="/?featured=true"
            className="text-sm font-semibold text-rose-500 flex items-center gap-1">
            Ver todos los favoritos →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Promo banner — dark editorial ─── */
function PromoBanner() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.3, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-ink-900 px-8 sm:px-14 py-12 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-6">

        {/* Animated ambient orbs */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-rose-500/22 blur-3xl animate-orb-pulse" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-rose-600/16 blur-2xl animate-orb-pulse" style={{ animationDelay: '2.2s' }} />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-40 h-40 rounded-full bg-[#C9A875]/10 blur-2xl animate-orb-pulse" style={{ animationDelay: '1.1s' }} />

        {/* Sparkle accents */}
        {[
          { x: '5%', y: '15%', d: '0.4s', t: '4.2s', s: 4 },
          { x: '12%', y: '75%', d: '1.5s', t: '3.6s', s: 3 },
          { x: '88%', y: '20%', d: '0.8s', t: '4.8s', s: 3 },
          { x: '92%', y: '70%', d: '2.2s', t: '3.9s', s: 4 },
        ].map((s, i) => (
          <div key={i}
            className="pointer-events-none absolute rounded-full bg-white/30"
            style={{
              left: s.x, top: s.y,
              width: s.s, height: s.s,
              animationName: 'sparkle-float',
              animationDuration: s.t,
              animationDelay: s.d,
              animationTimingFunction: 'ease-out',
              animationIterationCount: 'infinite',
            }} />
        ))}

        <div className="relative z-10 text-center sm:text-left">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-rose-400 mb-3">Productos 100% originales</p>
          <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white mb-2">
            Las marcas que amas,<br className="hidden sm:block" /> al mejor precio en{' '}
            <span className="text-rose-400">CR</span>
          </h3>
          <p className="text-white/45 text-sm">Envíos rápidos · SINPE y transferencia · WhatsApp</p>
        </div>
        <a href="https://wa.me/50688045100" target="_blank" rel="noopener noreferrer"
          className="relative z-10 flex-shrink-0 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1db954] text-white font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.04] active:scale-[0.97] text-sm sm:text-base whitespace-nowrap">
          <WaIcon /> Pedir por WhatsApp
        </a>
      </motion.div>
    </section>
  );
}

/* ─── Skeleton card ─── */
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

const PAGE_SIZE = 8;

/* ─── Catalog ─── */
function Catalog({ externalCat, catalogRef }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [animKey, setAnimKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
    setVisibleCount(PAGE_SIZE);
  };

  useEffect(() => {
    if (!externalCat) return;
    applyFilter({ cat: externalCat });
  }, [externalCat]);

  const handleCat   = (c) => applyFilter({ cat: c });
  const handleBrand = (b) => applyFilter({ brand: b });

  const { products, loading } = useProducts({ cat, brand, q });

  const catLabel = {
    todos: 'Todos los productos', ojos: 'Ojos', labios: 'Labios',
    rostro: 'Rostro', skincare: 'Skincare', cabello: 'Cabello',
    maquillaje: 'Maquillaje', accesorios: 'Accesorios', perfumes: 'Perfumes',
  }[cat] || cat;

  const visible = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

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
              <svg className="mx-auto mb-4 text-ink-300" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <p className="text-ink-400 text-lg font-medium">No encontramos productos con esos filtros.</p>
              <button onClick={() => handleCat('todos')} className="mt-5 text-rose-500 font-semibold hover:underline">
                Ver todos los productos
              </button>
            </motion.div>
          ) : (
            <>
              <motion.div key={`grid-${animKey}`}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.38, ease: [0.3, 1, 0.3, 1] }}
                className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {visible.map((p, i) => <ProductCard key={p.id || p._id} product={p} index={i} />)}
              </motion.div>
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <motion.button
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="inline-flex items-center gap-2 border-2 border-rose-400 text-rose-500 hover:bg-rose-500 hover:text-white font-semibold px-8 py-3 rounded-full transition-all duration-300">
                    Ver más productos
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </motion.button>
                </div>
              )}
              {!hasMore && products.length > PAGE_SIZE && (
                <p className="mt-8 text-center text-sm text-ink-400">
                  Mostrando todos los {products.length} productos
                </p>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─── Testimonials — auto-scroll on desktop, snap-scroll on mobile ─── */
const TESTIMONIALS = [
  { quote: 'Llegó en 2 días en perfecto estado. La paleta es idéntica a la foto.',     name: 'María F.',     city: 'Heredia',       tag: 'Ojos' },
  { quote: 'Ya es mi tercera compra. Siempre responden rapidísimo por WhatsApp.',      name: 'Daniela R.',   city: 'San José',      tag: 'Skincare' },
  { quote: 'Precios mejores que en el mall y todo original, 100% recomendadas.',        name: 'Andrea S.',    city: 'Liberia',       tag: 'Maquillaje' },
  { quote: 'Me asesoraron por WhatsApp para elegir mi tono de base. Atención de 10.', name: 'Karen M.',     city: 'Pérez Zeledón', tag: 'Rostro' },
  { quote: 'Las retiré en El Roble, súper fácil y super amables.',                      name: 'Valeria C.',   city: 'Puntarenas',    tag: 'Labios' },
  { quote: 'El envío llegó rapidísimo. Todo bien empacado y sellado.',                  name: 'Sofía P.',     city: 'Alajuela',      tag: 'Skincare' },
  { quote: 'Empaque bellísimo, se nota que le ponen amor a cada pedido.',               name: 'Natalia B.',   city: 'Cartago',       tag: 'Maquillaje' },
  { quote: 'Mi paleta favorita. Volveré por más, sin dudarlo.',                          name: 'Fiorella G.',  city: 'San Ramón',     tag: 'Ojos' },
  { quote: 'Envío llegó antes de lo esperado. Recomendadísimas a todas mis amigas.',   name: 'Stephanie L.', city: 'Guanacaste',    tag: 'Skincare' },
];

function TestimonialCard({ t }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-cream-200 hover:border-rose-200 hover:shadow-card transition-all duration-300 mb-4">
      <div className="text-rose-400 text-sm mb-2.5">★★★★★</div>
      <p className="text-ink-700 text-sm leading-relaxed mb-4">"{t.quote}"</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-ink-900">{t.name}</p>
          <p className="text-xs text-ink-400">{t.city}</p>
        </div>
        <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full">{t.tag}</span>
      </div>
    </div>
  );
}

function ScrollColumn({ items, direction = 'up', durationSecs = 34 }) {
  const ref = useRef(null);
  const doubled = [...items, ...items];
  const pause  = () => { if (ref.current) ref.current.style.animationPlayState = 'paused'; };
  const resume = () => { if (ref.current) ref.current.style.animationPlayState = 'running'; };

  return (
    <div className="overflow-hidden" style={{ height: '480px' }}>
      <div
        ref={ref}
        onMouseEnter={pause}
        onMouseLeave={resume}
        style={{ animation: `scroll-${direction} ${durationSecs}s linear infinite` }}>
        {doubled.map((t, i) => <TestimonialCard key={i} t={t} />)}
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const col1 = TESTIMONIALS.filter((_, i) => i % 3 === 0);
  const col2 = TESTIMONIALS.filter((_, i) => i % 3 === 1);
  const col3 = TESTIMONIALS.filter((_, i) => i % 3 === 2);

  return (
    <section className="bg-cream-50 py-16 sm:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-12">
          <span className="section-label">Lo que dicen nuestras clientas</span>
          <h2 className="section-title">
            Miles de reseñas,{' '}
            <em className="font-display italic text-rose-500">una sola promesa</em>
          </h2>
          <p className="text-ink-500 mt-3 max-w-xl mx-auto text-sm">
            Productos originales, envío rápido y atención cercana.
          </p>
        </motion.div>

        {/* Mobile: horizontal snap scroll */}
        <div className="sm:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
          <div className="flex gap-4 w-max pb-2">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="w-[80vw] flex-shrink-0 snap-start">
                <TestimonialCard t={t} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: infinite auto-scroll columns */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-5">
          <ScrollColumn items={col1} direction="up"   durationSecs={32} />
          <ScrollColumn items={col2} direction="down" durationSecs={28} />
          <ScrollColumn items={col3} direction="up"   durationSecs={38} />
        </div>
      </div>
    </section>
  );
}

/* ─── About ─── */
function AboutSection() {
  return (
    <section id="nosotras" className="bg-ink-900 text-white py-20 sm:py-28 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl animate-orb-pulse" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-rose-400/8 blur-3xl animate-orb-pulse" style={{ animationDelay: '3s' }} />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.3, 1, 0.3, 1] }}>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-rose-400 mb-4 block">Nosotras</span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Tu tienda de <em className="text-rose-400 not-italic">confianza</em> en CR
          </h2>
          <p className="text-white/65 leading-relaxed mb-4 max-w-2xl mx-auto">
            Somos JD Virtual Store, desde El Roble, Puntarenas. Nos especializamos en maquillaje y skincare de marcas auténticas al mejor precio.
          </p>
          <p className="text-white/65 leading-relaxed mb-8 max-w-2xl mx-auto">
            Cada producto es cuidadosamente seleccionado. Atendemos por WhatsApp con respuesta rápida y enviamos a toda Costa Rica.
          </p>
          <motion.a
            href="https://wa.me/50688045100" target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1db954] text-white font-bold px-8 py-4 rounded-full transition-colors shadow-xl">
            <WaIcon /> Escríbenos
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Shipping ─── */
function ShippingSection() {
  const methods = [
    { Icon: BoxIcon,       title: 'Correos de CR',      desc: '3–5 días hábiles a todo el país. Desde ₡2,000.' },
    { Icon: ZapIcon,       title: 'Express Puntarenas', desc: 'Mismo día o siguiente en zona Puntarenas.' },
    { Icon: HandshakeIcon, title: 'Retiro en El Roble', desc: 'Gratis. Coordinamos lugar y hora por WhatsApp.' },
  ];
  return (
    <section id="envios" className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12">
          <span className="section-label">Envíos</span>
          <h2 className="section-title">Coordinamos tu entrega</h2>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-5">
          {methods.map((m, i) => (
            <motion.div key={m.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: [0.3, 1, 0.3, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="bg-cream-50 border border-cream-200 rounded-3xl p-8 text-center hover:border-rose-200 hover:shadow-card-hover transition-all duration-400 group cursor-default">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300"
                style={{ background: 'rgba(184,95,114,0.1)' }}>
                <m.Icon />
              </div>
              <h3 className="font-display text-xl font-semibold text-ink-900 mb-3">{m.title}</h3>
              <p className="text-ink-500 text-sm leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Floating WhatsApp — with pulse rings ─── */
function FloatingWa() {
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className="absolute inset-0 rounded-full bg-[#25D366] animate-wa-ring" />
      <div className="absolute inset-0 rounded-full bg-[#25D366] animate-wa-ring" style={{ animationDelay: '1s' }} />
      <motion.a
        href="https://wa.me/50688045100"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        className="relative z-10 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center"
        style={{ boxShadow: '0 6px 28px rgba(37,211,102,0.55)' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </motion.a>
    </div>
  );
}

/* ─── Page ─── */
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
      <TrustBar />
      <BrandMarquee />
      <CategoryRow onCatSelect={handleCatSelect} />
      <FeaturedSection />
      <PromoBanner />
      <Catalog externalCat={selectedCat} catalogRef={catalogRef} />
      <TestimonialsSection />
      <AboutSection />
      <ShippingSection />
      <FloatingWa />
    </main>
  );
}
