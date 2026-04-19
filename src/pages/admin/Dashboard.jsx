import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { PRODUCTS } from '../../data/products';

const NAV = [
  { to: '/admin',           label: 'Dashboard',     icon: <DashIcon />,   exact: true },
  { to: '/admin/productos', label: 'Productos',      icon: <ProductIcon /> },
  { to: '/admin/ordenes',   label: 'Órdenes',        icon: <OrderIcon />   },
  { to: '/admin/config',    label: 'Configuración',  icon: <ConfigIcon />  },
];

/* ── icons ── */
function DashIcon()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function ProductIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>; }
function OrderIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>; }
function ConfigIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function MenuIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>; }
function CloseIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>; }
function LogoutIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

function StatCard({ label, value, sub, color = 'rose' }) {
  const colors = { rose: 'text-rose-500', green: 'text-green-500', gold: 'text-gold', blue: 'text-blue-500' };
  return (
    <div className="bg-white rounded-xl2 p-5 shadow-card">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`font-display text-2xl sm:text-3xl font-bold ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-ink-400 mt-1">{sub}</p>}
    </div>
  );
}

function DashboardHome() {
  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 mb-6">Bienvenida 👋</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard label="Productos activos" value={PRODUCTS.length} sub="En catálogo" color="rose" />
        <StatCard label="Pedidos hoy" value="—" sub="Conecta el backend" color="green" />
        <StatCard label="Ventas semana" value="—" sub="Conecta el backend" color="gold" />
        <StatCard label="Visitas" value="—" sub="Google Analytics" color="blue" />
      </div>
      <div className="bg-white rounded-xl2 shadow-card p-5 sm:p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Accesos rápidos</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/admin/productos/nuevo"
            className="flex items-center gap-3 p-4 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors">
            <span className="text-xl flex-shrink-0">➕</span>
            <div><p className="font-semibold text-ink-900 text-sm">Nuevo producto</p><p className="text-xs text-ink-400">Agregar al catálogo</p></div>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-cream-100 hover:bg-cream-200 rounded-xl transition-colors">
            <span className="text-xl flex-shrink-0">🌐</span>
            <div><p className="font-semibold text-ink-900 text-sm">Ver tienda</p><p className="text-xs text-ink-400">Abrir sitio público</p></div>
          </a>
          <a href="https://wa.me/50688045100" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
            <span className="text-xl flex-shrink-0">💬</span>
            <div><p className="font-semibold text-ink-900 text-sm">WhatsApp</p><p className="text-xs text-ink-400">Atender pedidos</p></div>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar content — shared between desktop & mobile drawer ── */
function SidebarContent({ location, onNavigate, onLogout, adminName }) {
  return (
    <>
      <div className="p-5 border-b border-ink-700 flex-shrink-0">
        <p className="font-display text-xl text-white font-semibold">JD <span className="text-rose-400">Admin</span></p>
        {adminName && <p className="text-ink-400 text-xs mt-1 truncate">{adminName}</p>}
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to} onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-rose-500 text-white' : 'text-ink-300 hover:bg-ink-700 hover:text-white'}`}>
              <span className="flex-shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-ink-700 flex-shrink-0">
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-ink-400 hover:bg-ink-700 hover:text-white transition-colors">
          <LogoutIcon /> Cerrar sesión
        </button>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/admin/login'); };
  const isDashboardHome = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-cream-50 flex">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-60 bg-ink-900 flex-shrink-0 flex-col fixed h-full z-20">
        <SidebarContent location={location} onLogout={handleLogout} adminName={admin?.name} />
      </aside>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-ink-900 flex flex-col transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-ink-700">
          <p className="font-display text-lg text-white font-semibold">JD <span className="text-rose-400">Admin</span></p>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-ink-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
        <SidebarContent
          location={location}
          onNavigate={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          adminName={admin?.name}
        />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 bg-ink-900 px-4 py-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-ink-300 hover:text-white transition-colors">
            <MenuIcon />
          </button>
          <p className="font-display text-lg text-white font-semibold">JD <span className="text-rose-400">Admin</span></p>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {isDashboardHome ? <DashboardHome /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
