'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './RouteMap.module.css';

// Nominatim OpenStreetMap Real Geocoder cache
const geocodeCache = new Map();

async function getRealCoordinates(locationQuery, fallbackLat, fallbackLng) {
  if (!locationQuery || typeof locationQuery !== 'string') {
    return { lat: fallbackLat, lng: fallbackLng, name: locationQuery || 'Location' };
  }

  const queryKey = locationQuery.toLowerCase().trim();
  if (geocodeCache.has(queryKey)) {
    return geocodeCache.get(queryKey);
  }

  try {
    // Append region context if missing for pinpoint accuracy
    const searchQuery = queryKey.includes('mumbai') || queryKey.includes('india') || queryKey.includes('thane')
      ? locationQuery
      : `${locationQuery}, Mumbai, India`;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
      { headers: { 'User-Agent': 'EcoRideCarpoolApp/1.0' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        name: data[0].display_name.split(',')[0],
      };
      geocodeCache.set(queryKey, result);
      return result;
    }
  } catch (err) {
    console.warn('Geocoding fallback used for:', locationQuery);
  }

  const fallback = { lat: fallbackLat, lng: fallbackLng, name: locationQuery };
  geocodeCache.set(queryKey, fallback);
  return fallback;
}

// Fetch real driving route geometry from OSRM (Open Source Routing Machine)
async function fetchRealDrivingRoute(points) {
  try {
    const locString = points.map((p) => `${p[1]},${p[0]}`).join(';');
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${locString}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map((c) => [c[1], c[0]]);
      const distanceKm = (route.distance / 1000).toFixed(1);
      const estMinutes = Math.round(route.duration / 60);
      return { coordinates, distanceKm, estMinutes };
    }
  } catch (e) {
    console.warn('OSRM routing fallback used');
  }
  return null;
}

export default function RouteMap({
  origin = { name: 'Andheri West, Mumbai', lat: 19.1364, lng: 72.8296 },
  destination = { name: 'Bandra Kurla Complex', lat: 19.0596, lng: 72.8656 },
  waypoints = [],
  interactive = true,
  height = '280px',
  liveTracking = true,
  onRouteCalculated,
}) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const animIntervalRef = useRef(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [cabStatus, setCabStatus] = useState('En Route to Destination');

  useEffect(() => {
    let isMounted = true;

    async function initRealMap() {
      if (typeof window === 'undefined' || !mapRef.current) return;

      const L = (await import('leaflet')).default;

      if (!isMounted) return;

      const originName = typeof origin === 'string' ? origin : origin.name;
      const destName = typeof destination === 'string' ? destination : destination.name;

      const realStart = await getRealCoordinates(originName, origin.lat || 19.1364, origin.lng || 72.8296);
      const realDest = await getRealCoordinates(destName, destination.lat || 19.0596, destination.lng || 72.8656);

      const realWaypoints = [];
      for (const wp of waypoints) {
        const wpName = typeof wp === 'string' ? wp : wp.name;
        const realWp = await getRealCoordinates(wpName, wp.lat, wp.lng);
        realWaypoints.push(realWp);
      }

      if (!isMounted) return;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current);
      }

      const map = L.map(mapRef.current, {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: false,
      });

      leafletMapRef.current = map;

      // Dark style tile layer similar to Uber/Ola night theme or clean map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Start Marker (Pickup Pin)
      const startIcon = L.divIcon({
        className: 'custom-map-pin-start',
        html: `<div style="background:#10b981; color:white; padding:5px 12px; border-radius:20px; font-weight:700; font-size:11px; white-space:nowrap; box-shadow:0 4px 12px rgba(16,185,129,0.4); border:2px solid white; display:flex; align-items:center; gap:4px;">🟢 Pickup: ${realStart.name || 'Start'}</div>`,
        iconAnchor: [35, 15],
      });

      // Destination Marker (Dropoff Pin)
      const destIcon = L.divIcon({
        className: 'custom-map-pin-dest',
        html: `<div style="background:#ef4444; color:white; padding:5px 12px; border-radius:20px; font-weight:700; font-size:11px; white-space:nowrap; box-shadow:0 4px 12px rgba(239,68,68,0.4); border:2px solid white; display:flex; align-items:center; gap:4px;">🔴 Dropoff: ${realDest.name || 'Destination'}</div>`,
        iconAnchor: [40, 15],
      });

      L.marker([realStart.lat, realStart.lng], { icon: startIcon }).addTo(map).bindPopup(`<b>Pickup Point:</b> ${realStart.name}`);
      L.marker([realDest.lat, realDest.lng], { icon: destIcon }).addTo(map).bindPopup(`<b>Dropoff Point:</b> ${realDest.name}`);

      const waypointsPoints = [];
      realWaypoints.forEach((wp, index) => {
        waypointsPoints.push([wp.lat, wp.lng]);
        const wpIcon = L.divIcon({
          className: 'custom-map-pin-wp',
          html: `<div style="background:#f59e0b; color:white; padding:4px 8px; border-radius:12px; font-weight:600; font-size:10px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.2); border:1px solid white;">Stop ${index + 1}: ${wp.name}</div>`,
          iconAnchor: [25, 10],
        });
        L.marker([wp.lat, wp.lng], { icon: wpIcon }).addTo(map).bindPopup(`<b>Stop ${index + 1}:</b> ${wp.name}`);
      });

      const routeKeypoints = [[realStart.lat, realStart.lng], ...waypointsPoints, [realDest.lat, realDest.lng]];

      // Fetch turn-by-turn road polyline from OSRM
      const osrmResult = await fetchRealDrivingRoute(routeKeypoints);

      let polylinePoints = routeKeypoints;
      let distKm = '0';
      let estMins = 0;

      if (osrmResult) {
        polylinePoints = osrmResult.coordinates;
        distKm = osrmResult.distanceKm;
        estMins = osrmResult.estMinutes;
      } else {
        let totalDist = 0;
        for (let i = 0; i < routeKeypoints.length - 1; i++) {
          const p1 = L.latLng(routeKeypoints[i][0], routeKeypoints[i][1]);
          const p2 = L.latLng(routeKeypoints[i + 1][0], routeKeypoints[i + 1][1]);
          totalDist += p1.distanceTo(p2);
        }
        distKm = (totalDist / 1000).toFixed(1);
        estMins = Math.round((distKm / 35) * 60);
      }

      // Draw Ola/Uber style route polyline (bold dark teal/black path line with glowing inner core)
      L.polyline(polylinePoints, {
        color: '#0f172a',
        weight: 7,
        opacity: 0.8,
      }).addTo(map);

      L.polyline(polylinePoints, {
        color: '#10b981',
        weight: 4,
        opacity: 0.95,
      }).addTo(map);

      // Fit map bounds smoothly
      const bounds = L.latLngBounds(routeKeypoints);
      map.fitBounds(bounds, { padding: [40, 40] });

      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 250);

      // Live Animated Cab Car Icon (Moving along OSRM path like Ola & Uber)
      if (liveTracking && polylinePoints.length > 1) {
        const carDivIcon = L.divIcon({
          className: 'ola-uber-car-marker',
          html: `
            <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
              <div style="position:absolute; inset:0; background:rgba(16, 185, 129, 0.35); border-radius:50%; animation: pulseRing 1.5s infinite ease-out;"></div>
              <div style="position:relative; width:30px; height:30px; background:#0f172a; border:2px solid #10b981; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.5); font-size:16px;">
                🚗
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const liveCarMarker = L.marker(polylinePoints[0], { icon: carDivIcon }).addTo(map);
        liveCarMarker.bindPopup('<b>Live Cab Driver</b><br/>En Route');

        let stepIndex = 0;
        animIntervalRef.current = setInterval(() => {
          stepIndex = (stepIndex + 1) % polylinePoints.length;
          const currentPos = polylinePoints[stepIndex];
          liveCarMarker.setLatLng(currentPos);

          if (stepIndex === 0) {
            setCabStatus('Driver at Pickup Point');
          } else if (stepIndex === Math.floor(polylinePoints.length / 2)) {
            setCabStatus('Mid-Trip: En Route');
          } else if (stepIndex === polylinePoints.length - 1) {
            setCabStatus('Arriving at Destination');
          }
        }, 1200);
      }

      const info = { distanceKm: distKm, estMinutes: estMins };
      setRouteInfo(info);
      if (onRouteCalculated) onRouteCalculated(info);
    }

    initRealMap();

    return () => {
      isMounted = false;
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current);
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [
    typeof origin === 'string' ? origin : origin.name,
    typeof destination === 'string' ? destination : destination.name,
    JSON.stringify(waypoints),
  ]);

  return (
    <div className={styles.mapWrapper} style={{ height }}>
      <div ref={mapRef} className={styles.mapContainer} />
      {routeInfo && (
        <div className={styles.routeOverlay}>
          <div className={styles.overlayTag}>
            <span className={styles.livePulse}></span>
            <span>Live Cab Tracking: <strong>{cabStatus}</strong></span>
          </div>
          <div className={styles.overlayTag}>
            <span>🧭 <strong>{routeInfo.distanceKm} km</strong> · ⏱️ <strong>{routeInfo.estMinutes} mins</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
