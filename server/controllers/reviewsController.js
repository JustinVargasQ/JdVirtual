const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
let cache = { data: null, expiresAt: 0 };

// Read env at request time so we don't freeze a missing value at module-load.
const getConfig = () => ({
  KEY:      process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_SERVER_MAPS_KEY,
  PLACE_ID: process.env.GOOGLE_PLACE_ID,
});

async function fetchFromGoogle() {
  const { KEY, PLACE_ID } = getConfig();
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', PLACE_ID);
  url.searchParams.set('fields', 'name,rating,user_ratings_total,reviews,url');
  url.searchParams.set('language', 'es');
  url.searchParams.set('reviews_sort', 'newest');
  url.searchParams.set('key', KEY);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const body = await res.json();
  if (body.status !== 'OK') {
    const detail = body.error_message ? ` — ${body.error_message}` : '';
    throw new Error(`Places API ${body.status}${detail}`);
  }

  const r = body.result;
  return {
    name: r.name,
    rating: r.rating ?? null,
    total: r.user_ratings_total ?? 0,
    url: r.url ?? null,
    reviews: (r.reviews || []).map((rev) => ({
      author: rev.author_name,
      avatar: rev.profile_photo_url,
      rating: rev.rating,
      text: (rev.text || '').trim(),
      relativeTime: rev.relative_time_description,
      time: rev.time,
    })),
  };
}

exports.refresh = async (req, res, next) => {
  cache = { data: null, expiresAt: 0 };
  return exports.get(req, res, next);
};

exports.get = async (req, res) => {
  const { KEY, PLACE_ID } = getConfig();
  if (!KEY || !PLACE_ID) {
    console.warn('[reviews] Missing env vars — KEY:', Boolean(KEY), 'PLACE_ID:', Boolean(PLACE_ID));
    return res.status(503).json({ error: 'Reseñas no configuradas', missing: { KEY: !KEY, PLACE_ID: !PLACE_ID } });
  }

  const now = Date.now();
  if (cache.data && now < cache.expiresAt) {
    return res.json({ ...cache.data, cached: true });
  }

  try {
    const data = await fetchFromGoogle();
    cache = { data, expiresAt: now + CACHE_TTL_MS };
    res.json({ ...data, cached: false });
  } catch (err) {
    console.error('[reviews] Google fetch failed:', err.message);
    if (cache.data) return res.json({ ...cache.data, cached: true, stale: true });
    // Surface Google's reason in the response so the admin can diagnose from the browser console.
    res.status(502).json({ error: 'No se pudieron obtener las reseñas', detail: err.message });
  }
};
