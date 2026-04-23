const GA_ID = 'G-PMP26BQ68Y';

function gtag(...args) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag(...args);
}

export function trackPageView(path) {
  gtag('event', 'page_view', {
    page_location: window.location.origin + path,
    page_path: path,
    send_to: GA_ID,
  });
}

export function trackAddToCart(product, qty = 1) {
  gtag('event', 'add_to_cart', {
    currency: 'CRC',
    value: product.price * qty,
    items: [{
      item_id:   product._id || product.id,
      item_name: product.name,
      item_brand: product.brand || '',
      price:     product.price,
      quantity:  qty,
    }],
  });
}

export function trackBeginCheckout(items, total) {
  gtag('event', 'begin_checkout', {
    currency: 'CRC',
    value: total,
    items: items.map((i) => ({
      item_id:   i._id || i.id,
      item_name: i.name,
      item_brand: i.brand || '',
      price:     i.price,
      quantity:  i.qty,
    })),
  });
}

export function trackPurchase(orderNumber, items, total) {
  gtag('event', 'purchase', {
    transaction_id: orderNumber,
    currency: 'CRC',
    value: total,
    items: items.map((i) => ({
      item_id:   i._id || i.id,
      item_name: i.name,
      item_brand: i.brand || '',
      price:     i.price,
      quantity:  i.qty,
    })),
  });
}

export function trackSearch(term) {
  gtag('event', 'search', { search_term: term });
}

export function trackViewItem(product) {
  gtag('event', 'view_item', {
    currency: 'CRC',
    value: product.price,
    items: [{
      item_id:   product._id || product.id,
      item_name: product.name,
      item_brand: product.brand || '',
      price:     product.price,
    }],
  });
}
