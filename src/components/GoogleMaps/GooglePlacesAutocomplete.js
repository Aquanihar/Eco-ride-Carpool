'use client';

import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '@/lib/googleMaps';

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className,
  id,
  required,
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((maps) => {
        if (!isMounted || !inputRef.current) return;

        // Initialize Google Autocomplete
        const autocomplete = new maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
        });

        autocompleteRef.current = autocomplete;

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place && place.geometry) {
            const selectedData = {
              name: place.formatted_address || place.name || inputRef.current.value,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              placeId: place.place_id || '',
            };
            if (onChange) onChange(selectedData.name);
            if (onPlaceSelect) onPlaceSelect(selectedData);
          }
        });
      })
      .catch((err) => {
        // Fallback gracefully to standard text input if key is missing or load fails
      });

    return () => {
      isMounted = false;
      if (autocompleteRef.current && window.google && window.google.maps) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      id={id}
      required={required}
    />
  );
}
