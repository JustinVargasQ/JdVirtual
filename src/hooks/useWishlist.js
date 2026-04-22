import useWishlistStore from '../store/wishlistStore';

export default function useWishlist() {
  const items  = useWishlistStore((s) => s.items);
  const toggle = useWishlistStore((s) => s.toggle);
  const remove = useWishlistStore((s) => s.remove);
  const has    = useWishlistStore((s) => s.has);
  const clear  = useWishlistStore((s) => s.clear);
  const count  = items.length;
  return { items, count, toggle, remove, has, clear };
}
