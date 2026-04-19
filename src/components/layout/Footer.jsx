import { Link } from 'react-router-dom';

const WaIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

export default function Footer() {
  const links = [
    { label: 'Skincare',   cat: 'skincare' },
    { label: 'Maquillaje', cat: 'maquillaje' },
    { label: 'Labios',     cat: 'labios' },
    { label: 'Ojos',       cat: 'ojos' },
    { label: 'Rostro',     cat: 'rostro' },
    { label: 'Cabello',    cat: 'cabello' },
  ];

  return (
    <footer className="bg-ink-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 grid grid-cols-1 sm:grid-cols-3 gap-12">

        {/* Brand */}
        <div>
          <p className="font-display text-2xl font-bold mb-3">
            JD <span className="text-rose-400">Virtual</span>
          </p>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Maquillaje y skincare de marcas auténticas. Envíos a todo Costa Rica desde El Roble, Puntarenas.
          </p>
          <a href="https://wa.me/50688045100" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors">
            <WaIcon /> 8804-5100
          </a>
        </div>

        {/* Categories */}
        <div>
          <p className="text-white font-bold mb-5 text-xs tracking-[0.15em] uppercase">Categorías</p>
          <ul className="space-y-2.5">
            {links.map((l) => (
              <li key={l.cat}>
                <Link to={`/?cat=${l.cat}`} className="text-white/60 hover:text-rose-300 text-sm transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-white font-bold mb-5 text-xs tracking-[0.15em] uppercase">Contacto</p>
          <ul className="space-y-3 text-sm text-white/60">
            <li className="flex items-center gap-2"><span className="text-green-400">●</span> WhatsApp 8804-5100</li>
            <li>El Roble, Puntarenas, CR</li>
            <li>Lun–Sáb · 9am–7pm</li>
            <li className="pt-2">
              <Link to="/admin/login" className="text-white/30 hover:text-white/60 text-xs transition-colors">
                Acceso admin
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/30">
        © {new Date().getFullYear()} JD Virtual Store · Todos los derechos reservados · El Roble, Puntarenas
      </div>
    </footer>
  );
}
