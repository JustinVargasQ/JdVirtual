import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart:  () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem(product, qty = 1) {
        set((s) => {
          const existing = s.items.find((i) => i.id === product.id);
          if (existing) {
            return { items: s.items.map((i) => i.id === product.id ? { ...i, qty: i.qty + qty } : i) };
          }
          return { items: [...s.items, { ...product, qty }] };
        });
      },

      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      updateQty(id, qty) {
        if (qty < 1) return get().removeItem(id);
        set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, qty } : i) }));
      },

      clearCart: () => set({ items: [] }),

      get total() {
        return get().items.reduce((s, i) => s + i.price * i.qty, 0);
      },
      get count() {
        return get().items.reduce((s, i) => s + i.qty, 0);
      },
    }),
    { name: 'jd-cart-v2' }
  )
);

export default useCartStore;
