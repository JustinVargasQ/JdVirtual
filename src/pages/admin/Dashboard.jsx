import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { PRODUCTS } from '../../data/products';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/admin/productos', label: 'Productos', icon: '🛍️' },
  { to: '/admin/ordenes', label: 'Órdenes', icon: '📦' },
  { to: '/admin/config', label: 'Configuración', icon: '⚙️' },
];

function StatCard({ label, value, sub, color = 'rose' }) {
  const colors = { rose: 'text-rose-500', green: 'text-green-500', gold: 'text-gold', blue: 'text-blue-500' };
  return (
    <div className="bg-white rounded-xl2 p-6 shadow-card">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`font-display text-3xl font-bold ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-ink-400 mt-1">{sub}</p>}
    </div>
  );
}

function DashboardHome() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink-900 mb-8">Bienvenida 👋</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Productos activos" value={PRODUCTS.length} sub="En catálogo" color="rose" />
        <StatCard label="Pedidos hoy" value="—" sub="Conecta el backend" color="green" />
        <StatCard label="Ventas semana" value="—" sub="Conecta el backend" color="gold" />
        <StatCard label="Visitas" value="—" sub="Google Analytics" color="blue" />
      </div>
      <div className="bg-white rounded-xl2 shadow-card p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Accesos rápidos</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/admin/productos/nuevo"
            className="flex items-center gap-3 p-4 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors">
            <span className="text-2xl">➕</span>
            <div><p className="font-semibold text-ink-900 text-sm">Nuevo producto</p><p className="text-xs text-ink-400">Agregar al catálogo</p></div>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-cream-100 hover:bg-cream-200 rounded-xl transition-colors">
            <span className="text-2xl">🌐</span>
            <div><p className="font-semibold text-ink-900 text-sm">Ver tienda</p><p className="text-xs text-ink-400">Abrir sitio público</p></div>
          </a>
          <a href="https://wa.me/50688045100" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
            <span className="text-2xl">💬</span>
            <div><p className="font-semibold text-ink-900 text-sm">WhatsApp</p><p className="text-xs text-ink-400">Atender pedidos</p></div>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();

  const handleLogout = () => { logout(); navigate('/admin/login'); };
  const isDashboardHome = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-ink-900 flex-shrink-0 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-ink-700">
          <p className="font-display text-xl text-white font-semibold">JD <span className="text-rose-400">Admin</span></p>
          <p className="text-ink-400 text-xs mt-1">{admin?.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-rose-500 text-white' : 'text-ink-300 hover:bg-ink-700 hover:text-white'}`}>
                <span>{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-ink-700">
          <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-ink-400 hover:bg-ink-700 hover:text-white transition-colors">
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 p-8 min-h-screen">
        {isDashboardHome ? <DashboardHome /> : <Outlet />}
      </main>
    </div>
  );
}
