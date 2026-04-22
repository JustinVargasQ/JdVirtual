import { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMaps, hasGoogleMapsKey } from '../../lib/loadGoogleMaps';

const STORE_LOCATION = { lat: 9.9830986, lng: -84.7347965 };

export default function MapAddressPicker({
  value,
  onChange,
  onPick,
  placeholder = 'Escribí o elegí en el mapa',
  className = '',
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          required={required}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 ${className}`}
          autoComplete="off"
        />
        {hasGoogleMapsKey && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors shadow-btn"
            title="Elegir ubicación en el mapa">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="hidden sm:inline">Mapa</span>
          </button>
        )}
      </div>

      {picked && picked.address === value && (
        <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Ubicación marcada en el mapa
        </p>
      )}

      {open && (
        <MapPickerModal
          initialCenter={picked || STORE_LOCATION}
          onClose={() => setOpen(false)}
          onConfirm={(result) => {
            setPicked(result);
            onChange?.(result.address);
            onPick?.(result);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MapPickerModal({ initialCenter, onClose, onConfirm }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ lat: initialCenter.lat, lng: initialCenter.lng });
  const [geocoding, setGeocoding] = useState(false);

  const reverseGeocode = useCallback((pos) => {
    if (!geocoderRef.current) return;
    setGeocoding(true);
    geocoderRef.current.geocode({ location: pos, language: 'es', region: 'CR' }, (results, status) => {
      setGeocoding(false);
      if (status === 'OK' && results[0]) {
        setAddress(results[0].formatted_address);
      } else {
        setAddress(`Ubicación: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
        });

        const marker = new google.maps.Marker({
          position: initialCenter,
          map,
          draggable: true,
          animation: google.maps.Animation.DROP,
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        geocoderRef.current = new google.maps.Geocoder();

        const updateFromPos = (pos) => {
          setCoords({ lat: pos.lat(), lng: pos.lng() });
          reverseGeocode({ lat: pos.lat(), lng: pos.lng() });
        };

        marker.addListener('dragend', () => updateFromPos(marker.getPosition()));
        map.addListener('click', (e) => {
          marker.setPosition(e.latLng);
          updateFromPos(e.latLng);
        });

        reverseGeocode(initialCenter);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'No se pudo cargar el mapa');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.panTo(p);
          mapInstanceRef.current.setZoom(18);
          markerRef.current.setPosition(p);
          setCoords(p);
          reverseGeocode(p);
        }
      },
      () => setError('No se pudo obtener tu ubicación. Activá GPS o permitís el acceso.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    onConfirm({ address, lat: coords.lat, lng: coords.lng });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-cream-100">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">Elegí tu ubicación</h3>
            <p className="text-[11px] text-ink-400">Tocá el mapa o arrastrá el pin 📍</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-cream-50 rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Map */}
        <div className="relative bg-cream-50" style={{ height: '50vh', minHeight: 320 }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-cream-50">
              <p className="text-ink-400 text-sm">Cargando mapa...</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-cream-50 p-6 text-center">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />

          {/* My location button — overlay */}
          {!loading && !error && (
            <button
              type="button"
              onClick={useMyLocation}
              className="absolute bottom-3 right-3 bg-white hover:bg-cream-50 shadow-lg rounded-full p-3 transition-colors border border-cream-200"
              title="Usar mi ubicación actual">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B85F72" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="5"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="5" y2="12"/>
                <line x1="19" y1="12" x2="22" y2="12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Address preview + actions */}
        <div className="px-4 sm:px-5 py-3.5 space-y-3 bg-cream-50">
          <div>
            <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1">Dirección detectada</p>
            <p className="text-sm text-ink-800 leading-snug min-h-[2.5em]">
              {geocoding ? <span className="text-ink-300">Obteniendo dirección...</span> : (address || '—')}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-cream-200 text-ink-700 hover:bg-white text-sm font-semibold transition-colors">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || !!error || !address}
              className="flex-[2] px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors shadow-btn">
              Confirmar ubicación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
