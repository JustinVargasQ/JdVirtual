import useCartStore from '../store/cartStore';

export default function useCart() {
  const items      = useCartStore((s) => s.items);
  const isOpen     = useCartStore((s) => s.isOpen);
  const addItem    = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty  = useCartStore((s) => s.updateQty);
  const clearCart  = useCartStore((s) => s.clearCart);
  const openCart   = useCartStore((s) => s.openCart);
  const closeCart  = useCartStore((s) => s.closeCart);
  const toggleCart = useCartStore((s) => s.toggleCart);

  const couponCode  = useCartStore((s) => s.couponCode);
  const setCoupon   = useCartStore((s) => s.setCoupon);
  const clearCoupon = useCartStore((s) => s.clearCoupon);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, isOpen, total, count, couponCode, setCoupon, clearCoupon, addItem, removeItem, updateQty, clearCart, openCart, closeCart, toggleCart };
}
