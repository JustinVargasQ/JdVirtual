import { useEffect } from 'react';
import useToastStore from '../../store/toastStore';

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const STYLES = {
  success: 'bg-white border-green-200 text-green-700',
  error:   'bg-white border-red-200 text-red-600',
  info:    'bg-white border-cream-200 text-ink-700',
};

function ConfirmDialog() {
  const confirm      = useToastStore((s) => s.confirm);
  const closeConfirm = useToastStore((s) => s.closeConfirm);

  useEffect(() => {
    if (!confirm) return;
    const onEsc = (e) => e.key === 'Escape' && closeConfirm(false);
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [confirm, closeConfirm]);

  if (!confirm) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => closeConfirm(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            confirm.danger ? 'bg-red-50 text-red-500' : 'bg-rose-50 text-rose-500'
          }`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            {confirm.title && <p className="font-display font-semibold text-ink-900 text-base mb-1">{confirm.title}</p>}
            {confirm.message && <p className="text-sm text-ink-500 leading-relaxed">{confirm.message}</p>}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => closeConfirm(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-cream-200 text-ink-600 hover:bg-cream-50 transition-colors">
            {confirm.cancelText}
          </button>
          <button onClick={() => closeConfirm(true)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors shadow-btn ${
              confirm.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-rose-500 hover:bg-rose-600'
            }`}>
            {confirm.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <>
      <ConfirmDialog />
      <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none max-w-sm w-[calc(100vw-2rem)] sm:w-auto">
        {toasts.map((t) => (
          <div key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${STYLES[t.type]} animate-toast-in`}>
            <div className="flex-shrink-0 mt-0.5">{ICONS[t.type]}</div>
            <div className="flex-1 min-w-0 text-sm font-medium">
              {t.title && <p className="font-semibold mb-0.5">{t.title}</p>}
              <p className="leading-snug">{t.message}</p>
            </div>
            <button onClick={() => remove(t.id)}
              className="flex-shrink-0 text-ink-300 hover:text-ink-600 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
