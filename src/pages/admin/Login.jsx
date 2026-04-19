import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: 'admin@jdvirtual.com', password: '' });
  const { login, error, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(form.email, form.password);
    if (ok) navigate('/admin');
  };

  const inputCls = 'w-full border border-cream-200 rounded-xl px-4 py-3 text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-rose-400 transition-colors bg-white';

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display text-3xl font-semibold text-ink-900">
            JD <span className="text-rose-500">Admin</span>
          </p>
          <p className="text-ink-400 text-sm mt-2">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-card p-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Email</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="admin@jdvirtual.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1.5">Contraseña</label>
            <input type="password" required value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••" className={inputCls} />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-btn">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          <p className="text-center text-xs text-ink-400 pt-1">
            Demo: admin@jdvirtual.com / jd2024
          </p>
        </form>
      </div>
    </div>
  );
}
