import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, hasGoogleMapsKey } from '../../lib/loadGoogleMaps';

const CR_PROVINCES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

function normalizeProvince(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/\s*Province$/i, '').trim();
  const match = CR_PROVINCES.find(
    (p) => p.toLowerCase() === cleaned.toLowerCase() ||
           p.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') ===
           cleaned.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  );
  return match || null;
}

function parsePlace(place) {
  const comps = place.address_components || [];
  const get = (type) => comps.find((c) => c.types.includes(type))?.long_name || '';

  const provinceRaw = get('administrative_area_level_1');
  const canton      = get('administrative_area_level_2');
  const district    = get('administrative_area_level_3') || get('locality') || get('sublocality');

  return {
    address: place.formatted_address || '',
    province: normalizeProvince(provinceRaw),
    canton,
    district,
    lat: place.geometry?.location?.lat() ?? null,
    lng: place.geometry?.location?.lng() ?? null,
    placeId: place.place_id || null,
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Empezá a escribir tu dirección...',
  className = '',
  required = false,
  id,
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!hasGoogleMapsKey);

  useEffect(() => {
    if (!hasGoogleMapsKey) return;
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'cr' },
          fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
          types: ['address'],
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (!place?.geometry) return;
          const parsed = parsePlace(place);
          onChange?.(parsed.address);
          onSelect?.(parsed);
        });
        autocompleteRef.current = ac;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {hasGoogleMapsKey && !ready && !failed && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-300 pointer-events-none">
          cargando…
        </span>
      )}
    </div>
  );
}
