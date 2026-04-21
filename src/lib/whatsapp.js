import { formatCRC } from './currency';
import { WHATSAPP_NUMBER } from '../data/products';

export function buildWhatsAppMessage(items, customer = null) {
  const lines = items.map(
    (i) => `• ${i.name} × ${i.qty}  —  ${formatCRC(i.price * i.qty)}`
  );
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  const parts = [
    '¡Hola! Quisiera hacer el siguiente pedido 🛍️',
    '',
    ...lines,
    '',
    `*Subtotal: ${formatCRC(subtotal)}*`,
  ];

  if (customer?.name)    parts.push(`\nNombre: ${customer.name}`);
  if (customer?.phone)   parts.push(`Teléfono: ${customer.phone}`);
  if (customer?.address) parts.push(`Dirección: ${customer.address}`);
  if (customer?.lat && customer?.lng) {
    parts.push(`📍 Ubicación: https://maps.google.com/?q=${customer.lat},${customer.lng}`);
  }

  parts.push('\n¿Cómo puedo coordinar el pago y envío? 🙏');

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(parts.join('\n'))}`;
}
