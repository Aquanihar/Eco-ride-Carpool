'use client';

import { useState, useEffect } from 'react';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';

let scriptLoadingPromise = null;

export function loadGoogleMaps() {
  if (typeof window === 'undefined') return Promise.reject('SSR');

  // If Google Maps API is already loaded on window
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    return Promise.reject('NO_KEY');
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,routes,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject('LOAD_FAILED');
      }
    };

    script.onerror = () => {
      scriptLoadingPromise = null;
      reject('SCRIPT_ERROR');
    };

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        setError(err);
      });
  }, []);

  return { isLoaded, error, google: typeof window !== 'undefined' ? window.google : null };
}
