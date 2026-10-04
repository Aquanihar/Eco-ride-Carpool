'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppProvider, useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar/Navbar';
import RideCard from '@/components/RideCard/RideCard';
import Footer from '@/components/Footer/Footer';
import GooglePlacesAutocomplete from '@/components/GoogleMaps/GooglePlacesAutocomplete';
import GoogleMapView from '@/components/GoogleMaps/GoogleMapView';
import {
  MapPin,
  Navigation,
  Calendar,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  X,
  CheckCircle2,
  Leaf,
} from 'lucide-react';
import styles from './search.module.css';

function SearchContent() {
  const searchParams = useSearchParams();
  const { rides, searchRides, sendRideRequest } = useApp();
  const [fromLocation, setFromLocation] = useState({ name: searchParams.get('from') || '', lat: null, lng: null });
  const [toLocation, setToLocation] = useState({ name: searchParams.get('to') || '', lat: null, lng: null });
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(500);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [requestedToast, setRequestedToast] = useState(null);
  const [selectedRideId, setSelectedRideId] = useState(null);

  const results = useMemo(() => {
    let res;
    if (!fromLocation.name && !toLocation.name && !date) {
      res = rides.filter((r) => r.status === 'active' && r.seatsAvailable > 0);
    } else {
      res = searchRides(fromLocation.name, toLocation.name, date, fromLocation, toLocation);
    }

    /* Filters */
    if (onlyVerified) {
      res = res.filter((r) => r.driver.verified);
    }
    res = res.filter((r) => r.price <= maxPrice);

    /* Sort */
    if (sortBy === 'price') res.sort((a, b) => a.price - b.price);
    else if (sortBy === 'rating') res.sort((a, b) => b.driver.rating - a.driver.rating);
    else if (sortBy === 'time') res.sort((a, b) => a.time.localeCompare(b.time));
    else if (sortBy === 'seats') res.sort((a, b) => b.seatsAvailable - a.seatsAvailable);

    return res;
  }, [fromLocation, toLocation, date, rides, searchRides, sortBy, maxPrice, onlyVerified]);

  const handleBook = async (rideId) => {
    const ride = rides.find((r) => r.id === rideId);
    const result = await sendRideRequest(
      rideId,
      1,
      ride ? ride.from.name : 'Pickup Point',
      ride ? ride.to.name : 'Drop Point',
      'Requesting 1 seat for ride.'
    );
    if (result.success) {
      setRequestedToast(result.message || 'Ride request sent to driver (PENDING)!');
    } else {
      setRequestedToast(`Notice: ${result.message}`);
    }
    setTimeout(() => setRequestedToast(null), 4000);
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.searchHeroBg}>
          <img src="/images/search-bg.jpg" alt="" className={styles.searchHeroImg} />
        </div>
        <div className="container">
          {/* Search bar */}
          <div className={styles.searchSection}>
            <h1 className="heading-lg">Find Your Ride</h1>
            <div className={styles.searchBar}>
              <div className={styles.inputWrap}>
                <MapPin size={18} className={styles.inputIcon} />
                <GooglePlacesAutocomplete
                  value={fromLocation.name}
                  onChange={(name) => setFromLocation((prev) => ({ ...prev, name }))}
                  onPlaceSelect={(place) => setFromLocation(place)}
                  placeholder="From — e.g. Andheri"
                  className={styles.input}
                  id="search-from"
                />
              </div>
              <div className={styles.inputWrap}>
                <Navigation size={18} className={styles.inputIcon} />
                <GooglePlacesAutocomplete
                  value={toLocation.name}
                  onChange={(name) => setToLocation((prev) => ({ ...prev, name }))}
                  onPlaceSelect={(place) => setToLocation(place)}
                  placeholder="To — e.g. Bandra"
                  className={styles.input}
                  id="search-to"
                />
              </div>
              <div className={styles.inputWrap}>
                <Calendar size={18} className={styles.inputIcon} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={styles.input}
                  id="search-date"
                />
              </div>
              <button
                className={`btn btn-secondary btn-sm ${styles.filterBtn}`}
                onClick={() => setShowFilters(!showFilters)}
                id="toggle-filters"
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
            </div>

            {/* Filters panel */}
            {showFilters && (
              <div className={styles.filtersPanel}>
                <div className={styles.filterGroup}>
                  <label className="input-label">Max Price: ₹{maxPrice}</label>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className={styles.slider}
                    id="filter-price"
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={onlyVerified}
                      onChange={(e) => setOnlyVerified(e.target.checked)}
                      id="filter-verified"
                    />
                    <span>Verified drivers only</span>
                  </label>
                </div>
                <div className={styles.filterGroup}>
                  <label className="input-label">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input"
                    id="filter-sort"
                  >
                    <option value="price">Price (Low to High)</option>
                    <option value="rating">Rating (High to Low)</option>
                    <option value="time">Departure Time</option>
                    <option value="seats">Available Seats</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Google Map displaying search results */}
          {results.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <GoogleMapView
                rides={results}
                selectedRideId={selectedRideId}
                onRideSelect={(rideId) => setSelectedRideId(rideId)}
                height="320px"
                showRoute={false}
              />
            </div>
          )}

          {/* Results */}
          <div className={styles.resultsHeader}>
            <span className="text-sm">
              {results.length} ride{results.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {/* Booking toast */}
          {requestedToast && (
            <div className={styles.toast} id="booking-toast">
              <CheckCircle2 size={20} />
              <span>{requestedToast}</span>
            </div>
          )}

          <div className={styles.resultsList}>
            {results.length > 0 ? (
              results.map((ride) => (
                <RideCard key={ride.id} ride={ride} onBook={handleBook} />
              ))
            ) : (
              <div className={styles.empty}>
                <Leaf size={48} className={styles.emptyIcon} />
                <h3 className="heading-md">No rides found</h3>
                <p className="text-base">
                  Try adjusting your route or date. You can also{' '}
                  <a href="/offer" style={{ color: 'var(--primary-400)' }}>
                    offer a ride
                  </a>{' '}
                  and let others find you!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SearchPage() {
  return (
    <AppProvider>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} />}>
        <SearchContent />
      </Suspense>
    </AppProvider>
  );
}
