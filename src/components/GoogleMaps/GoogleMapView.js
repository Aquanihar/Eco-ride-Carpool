'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/googleMaps';
import styles from './GoogleMapView.module.css';

export default function GoogleMapView({
  origin,
  destination,
  waypoints = [],
  rides = [],
  selectedRideId = null,
  onRideSelect,
  height = '360px',
  showRoute = true,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef([]);

  const [mapError, setMapError] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((maps) => {
        if (!isMounted || !mapRef.current) return;

        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapRef.current, {
            zoom: 12,
            center: { lat: 19.076, lng: 72.8777 }, // Default Mumbai center
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          });
          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;

        // Clear existing markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        // Mode 1: Render Offer Ride / Single Route Map
        if (showRoute && origin && destination) {
          if (!directionsRendererRef.current) {
            directionsRendererRef.current = new maps.DirectionsRenderer({
              map,
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#10b981',
                strokeWeight: 5,
                strokeOpacity: 0.9,
              },
            });
          }

          const directionsService = new maps.DirectionsService();

          const originLoc = typeof origin === 'string' ? origin : (origin.lat && origin.lng ? { lat: Number(origin.lat), lng: Number(origin.lng) } : origin.name);
          const destLoc = typeof destination === 'string' ? destination : (destination.lat && destination.lng ? { lat: Number(destination.lat), lng: Number(destination.lng) } : destination.name);

          const formattedWaypoints = waypoints
            .filter((wp) => (typeof wp === 'string' ? wp.trim() : wp && wp.name))
            .map((wp) => ({
              location: typeof wp === 'string' ? wp : (wp.lat && wp.lng ? { lat: Number(wp.lat), lng: Number(wp.lng) } : wp.name),
              stopover: true,
            }));

          directionsService.route(
            {
              origin: originLoc,
              destination: destLoc,
              waypoints: formattedWaypoints,
              travelMode: maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === maps.DirectionsStatus.OK) {
                directionsRendererRef.current.setDirections(result);
                const leg = result.routes[0].legs[0];
                let totalDist = 0;
                let totalTime = 0;
                result.routes[0].legs.forEach((l) => {
                  totalDist += l.distance.value;
                  totalTime += l.duration.value;
                });
                setRouteSummary({
                  distance: (totalDist / 1000).toFixed(1) + ' km',
                  duration: Math.round(totalTime / 60) + ' mins',
                });
              }
            }
          );
        }

        // Mode 2: Find Ride Results Map with Ride Markers
        if (rides && rides.length > 0) {
          const bounds = new maps.LatLngBounds();
          const infoWindow = new maps.InfoWindow();

          rides.forEach((ride) => {
            if (!ride.from || !ride.from.lat || !ride.from.lng) return;

            const lat = Number(ride.from.lat);
            const lng = Number(ride.from.lng);
            const position = { lat, lng };
            bounds.extend(position);

            const isSelected = selectedRideId === ride.id;

            const marker = new maps.Marker({
              position,
              map,
              title: ride.driver.name,
              animation: isSelected ? maps.Animation.BOUNCE : null,
              icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: isSelected ? 10 : 8,
                fillColor: isSelected ? '#06b6d4' : '#10b981',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
            });

            marker.addListener('click', () => {
              infoWindow.setContent(`
                <div style="padding: 10px; font-family: sans-serif; max-width: 220px;">
                  <h4 style="margin: 0 0 6px; font-size: 15px; color: #0f172a;">${ride.driver.name}</h4>
                  <p style="margin: 0 0 4px; font-size: 12px; color: #475569;">📍 ${ride.from.name}</p>
                  <p style="margin: 0 0 8px; font-size: 12px; color: #475569;">🏁 ${ride.to.name}</p>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                    <span style="font-weight: 700; color: #10b981;">₹${ride.price}/seat</span>
                    <button id="infowindow-book-${ride.id}" style="background: #10b981; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600;">
                      Book Seat
                    </button>
                  </div>
                </div>
              `);
              infoWindow.open(map, marker);

              if (onRideSelect) {
                onRideSelect(ride.id);
              }
            });

            markersRef.current.push(marker);
          });

          if (rides.length > 0 && !showRoute) {
            map.fitBounds(bounds);
          }
        }
      })
      .catch((err) => {
        setMapError('Map unavailable. You can still enter locations manually.');
      });

    return () => {
      isMounted = false;
    };
  }, [origin, destination, JSON.stringify(waypoints), rides, selectedRideId]);

  if (mapError) {
    return (
      <div className={styles.mapErrorFallback} style={{ height }}>
        <p>{mapError}</p>
      </div>
    );
  }

  return (
    <div className={styles.mapWrapper} style={{ height }}>
      <div ref={mapRef} className={styles.mapContainer} />
      {routeSummary && (
        <div className={styles.routeOverlay}>
          <div className={styles.overlayTag}>
            <span>🧭 Distance: <strong>{routeSummary.distance}</strong></span>
          </div>
          <div className={styles.overlayTag}>
            <span>⏱️ Est. Time: <strong>{routeSummary.duration}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
