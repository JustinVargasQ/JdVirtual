import { useState, useEffect } from 'react';
import { PRODUCTS as LOCAL_PRODUCTS, BRANDS as LOCAL_BRANDS } from '../data/products';
import api from '../lib/api';

const USE_API = import.meta.env.VITE_API_URL;

/* ── Normalizer — aplica a todos los productos de la API ── */
function normalize(p) {
  return {
    ...p,
    id:      p._id || p.id,
    img:     p.images?.[0] || p.img || '',
    cat:     p.category || p.cat || '',
    reviews: p.reviewCount ?? p.reviews ?? 0,
  };
}

function normalizeLocal(arr) {
  return arr.map((p) => ({ ...p, img: p.img || p.images?.[0] || '' }));
}

/* ── useProducts ── */
export function useProducts({ cat = 'todos', brand = '', q = '' } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (!USE_API) {
      const filtered = LOCAL_PRODUCTS.filter((p) => {
        const matchCat   = cat === 'todos' || p.cat === cat;
        const matchBrand = !brand || p.brand === brand;
        const matchQ     = !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase());
        return matchCat && matchBrand && matchQ;
      });
      setProducts(normalizeLocal(filtered));
      setLoading(false);
      return;
    }

    const params = {};
    if (cat && cat !== 'todos') params.cat = cat;
    if (brand) params.brand = brand;
    if (q)     params.q = q;

    api.get('/products', { params })
      .then(({ data }) => { if (!cancelled) setProducts((data.products || []).map(normalize)); })
      .catch((err)     => { if (!cancelled) setError(err.message); })
      .finally(()      => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [cat, brand, q]);

  return { products, loading, error, total: products.length };
}

/* ── useProduct (detalle) ── */
export function useProduct(slug) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    if (!USE_API) {
      const found = LOCAL_PRODUCTS.find((p) => p.slug === slug);
      setProduct(found ? normalize(found) : null);
      setLoading(false);
      return;
    }

    api.get(`/products/${slug}`)
      .then(({ data }) => setProduct(normalize(data)))
      .catch((err)     => setError(err.message))
      .finally(()      => setLoading(false));
  }, [slug]);

  return { product, loading, error };
}

/* ── useBrands ── */
export function useBrands() {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    if (!USE_API) {
      setBrands(LOCAL_BRANDS.filter(Boolean));
      return;
    }
    api.get('/products/brands')
      .then(({ data }) => setBrands(data || []))
      .catch(() => setBrands(LOCAL_BRANDS.filter(Boolean)));
  }, []);

  return brands;
}

/* ── useFeatured — top sellers from orders, fallback to badge products ── */
export function useFeatured(limit = 4) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!USE_API) {
      setProducts(normalizeLocal(LOCAL_PRODUCTS.filter((p) => p.badge).slice(0, limit)));
      return;
    }
    api.get('/products/top-sellers', { params: { limit } })
      .then(({ data }) => setProducts((data.products || []).map(normalize)))
      .catch(() => setProducts([]));
  }, [limit]);

  return products;
}

/* ── useCategoryPreviews — returns { cat: imgUrl } map ── */
export function useCategoryPreviews() {
  const [images, setImages] = useState({});

  useEffect(() => {
    if (!USE_API) {
      const result = {};
      LOCAL_PRODUCTS.forEach((p) => {
        const img = p.img || p.images?.[0] || '';
        if (!result[p.cat] && img) result[p.cat] = img;
      });
      setImages(result);
      return;
    }
    api.get('/products', { params: { limit: 100 } })
      .then(({ data }) => {
        const result = {};
        (data.products || []).map(normalize).forEach((p) => {
          if (!result[p.cat] && p.img) result[p.cat] = p.img;
        });
        setImages(result);
      })
      .catch(() => setImages({}));
  }, []);

  return images;
}
