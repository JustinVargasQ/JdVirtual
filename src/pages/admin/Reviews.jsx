import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import useToastStore from '../../store/toastStore';

const StarFilled = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const StarEmpty = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-200">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => s <= rating ? <StarFilled key={s} /> : <StarEmpty key={s} />)}
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('pending'); // 'pending' | 'approved'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/product-reviews/admin/all', {
        params: { approved: tab === 'approved' ? 'true' : 'false' },
      });
      setReviews(data);
    } catch { setReviews([]); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    try {
      await api.patch(`/product-reviews/admin/${id}/approve`);
      useToastStore.getState().success('Reseña aprobada');
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch { useToastStore.getState().error('Error al aprobar'); }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/product-reviews/admin/${id}`);
      useToastStore.getState().success('Reseña eliminada');
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch { useToastStore.getState().error('Error al eliminar'); }
  };

  const pendingCount = tab === 'pending' ? reviews.length : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 leading-none">Reseñas</h1>
          <p className="text-ink-400 text-sm mt-1">Moderación de valoraciones de productos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'pending',  label: 'Pendientes' },
          { key: 'approved', label: 'Aprobadas' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === key ? 'bg-ink-900 text-white' : 'bg-white border border-cream-200 text-ink-600 hover:bg-cream-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-8 text-center text-ink-400 text-sm">
          Cargando reseñas...
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-100 shadow-card p-14 text-center">
          <div className="text-3xl mb-3">{tab === 'pending' ? '✅' : '⭐'}</div>
          <p className="text-ink-400 font-medium">
            {tab === 'pending' ? 'No hay reseñas pendientes de aprobación.' : 'No hay reseñas aprobadas todavía.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl border border-cream-100 shadow-card p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-sm flex-shrink-0">
                  {r.authorName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <p className="font-semibold text-ink-900 text-sm">{r.authorName}</p>
                    <Stars rating={r.rating} />
                    <span className="text-xs text-ink-400">
                      {new Date(r.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {r.product && (
                    <p className="text-xs text-rose-500 font-medium mb-2">{r.product.name}</p>
                  )}
                  {r.comment && (
                    <p className="text-sm text-ink-700 leading-relaxed">{r.comment}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {tab === 'pending' && (
                    <button onClick={() => approve(r._id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-colors">
                      Aprobar
                    </button>
                  )}
                  <button onClick={() => remove(r._id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
