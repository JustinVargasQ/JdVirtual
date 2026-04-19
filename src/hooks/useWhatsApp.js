import { buildWhatsAppMessage } from '../lib/whatsapp';
import useCart from './useCart';

export default function useWhatsApp() {
  const { items } = useCart();

  const openOrder = (customer = null) => {
    if (!items.length) return;
    window.open(buildWhatsAppMessage(items, customer), '_blank', 'noopener');
  };

  return { openOrder };
}
