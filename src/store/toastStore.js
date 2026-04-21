import { create } from 'zustand';

let idCounter = 0;
const nextId = () => ++idCounter;

const useToastStore = create((set, get) => ({
  toasts:  [],
  confirm: null,

  push: (toast) => {
    const id = nextId();
    const t  = { id, type: 'info', duration: 3500, ...toast };
    set((s) => ({ toasts: [...s.toasts, t] }));
    if (t.duration > 0) {
      setTimeout(() => get().remove(id), t.duration);
    }
    return id;
  },

  success: (message, opts = {}) => get().push({ type: 'success', message, ...opts }),
  error:   (message, opts = {}) => get().push({ type: 'error',   message, duration: 5000, ...opts }),
  info:    (message, opts = {}) => get().push({ type: 'info',    message, ...opts }),

  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  /** Returns a Promise<boolean> that resolves true if confirmed, false if cancelled. */
  askConfirm: ({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false } = {}) =>
    new Promise((resolve) => {
      set({ confirm: { title, message, confirmText, cancelText, danger, resolve } });
    }),

  closeConfirm: (result) => {
    const c = get().confirm;
    if (c?.resolve) c.resolve(result);
    set({ confirm: null });
  },
}));

export default useToastStore;
