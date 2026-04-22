const KEY      = process.env.GOOGLE_MAPS_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
let cache = { data: null, expiresAt: 0 };

async function fetchFromGoogle() {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', PLACE_ID);
  url.searchParams.set('fields', 'name,rating,user_ratings_total,reviews,url');
  url.searchParams.set('language', 'es');
  url.searchParams.set('reviews_sort', 'newest');
  url.searchParams.set('key', KEY);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Places API ${res.status}`);

  const body = await res.json();
  if (body.status !== 'OK') throw new Error(`Google Places status: ${body.status}`);

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
      text: rev.text,
      relativeTime: rev.relative_time_description,
      time: rev.time,
    })),
  };
}

exports.get = async (req, res) => {
  if (!KEY || !PLACE_ID) {
    return res.status(503).json({ error: 'Reseñas no configuradas' });
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
    res.status(502).json({ error: 'No se pudieron obtener las reseñas' });
  }
};
