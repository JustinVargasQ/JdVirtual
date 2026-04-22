import { useState, useEffect } from 'react';
import api from '../lib/api';

const USE_API = import.meta.env.VITE_API_URL;

export default function useGoogleReviews() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(Boolean(USE_API));
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!USE_API) { setLoading(false); return; }
    let cancelled = false;

    api.get('/reviews')
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.error || err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
