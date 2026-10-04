'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import GooglePlacesAutocomplete from '@/components/GoogleMaps/GooglePlacesAutocomplete';
import GoogleMapView from '@/components/GoogleMaps/GoogleMapView';
import {
  MapPin,
  Navigation,
  Calendar,
  Clock,
  Users,
  Car,
  Palette,
  Hash,
  IndianRupee,
  Plus,
  X,
  CheckCircle2,
  Route,
  Leaf,
} from 'lucide-react';
import styles from './offer.module.css';

function OfferContent() {
  const router = useRouter();
  const { postRide } = useApp();
  const [success, setSuccess] = useState(false);

  const [fromLocation, setFromLocation] = useState({ name: '', lat: null, lng: null, placeId: '' });
  const [toLocation, setToLocation] = useState({ name: '', lat: null, lng: null, placeId: '' });
  const [waypointsData, setWaypointsData] = useState([{ name: '', lat: null, lng: null, placeId: '' }]);

  const [form, setForm] = useState({
    date: '',
    time: '',
    seats: 3,
    price: '',
    vehicleModel: '',
    vehicleColor: '',
    vehiclePlate: '',
    recurring: false,
  });
  const [prefs, setPrefs] = useState([]);

  const PREF_OPTIONS = [
    'No Smoking',
    'Music OK',
    'Pet Friendly',
    'Quiet Ride',
    'No Food',
    'Ladies Preferred',
    'AC',
    'EV',
  ];

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addWaypoint = () =>
    setWaypointsData((w) => [...w, { name: '', lat: null, lng: null, placeId: '' }]);

  const removeWaypoint = (i) =>
    setWaypointsData((w) => w.filter((_, idx) => idx !== i));

  const updateWaypointData = (i, data) =>
    setWaypointsData((w) => w.map((wp, idx) => (idx === i ? data : wp)));

  const togglePref = (p) =>
    setPrefs((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rideData = {
      from: {
        name: fromLocation.name,
        lat: fromLocation.lat || 19.1364,
        lng: fromLocation.lng || 72.8296,
        placeId: fromLocation.placeId || '',
      },
      to: {
        name: toLocation.name,
        lat: toLocation.lat || 19.0596,
        lng: toLocation.lng || 72.8656,
        placeId: toLocation.placeId || '',
      },
      waypoints: waypointsData
        .filter((w) => w.name && w.name.trim())
        .map((w) => ({
          name: w.name,
          lat: w.lat || 19.0968,
          lng: w.lng || 72.8432,
          placeId: w.placeId || '',
        })),
      date: form.date,
      time: form.time,
      seats: form.seats,
      seatsAvailable: form.seats,
      price: parseInt(form.price) || 0,
      vehicle: {
        model: form.vehicleModel,
        color: form.vehicleColor,
        plate: form.vehiclePlate,
      },
      preferences: prefs,
      recurring: form.recurring,
    };

    await postRide(rideData);
    setSuccess(true);
    setTimeout(() => router.push('/my-rides'), 1000);
  };

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <span className="badge badge-primary">
              <Route size={12} /> Share Your Route
            </span>
            <h1 className="heading-lg">Offer a Ride</h1>
            <p className="text-lg">
              Heading somewhere? Let others join your journey. Earn back fuel costs
              and reduce emissions.
            </p>
          </div>

          {success && (
            <div className={styles.successBanner} id="offer-success">
              <CheckCircle2 size={24} />
              <div>
                <strong>Ride posted successfully! 🎉</strong>
                <p>Redirecting to My Rides...</p>
              </div>
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit} id="offer-form">
            {/* Route */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <MapPin size={18} /> Route Details
              </h3>
              <div className={styles.formGrid}>
                <div className="input-group">
                  <label className="input-label">Pickup Location *</label>
                  <div className="input-with-icon">
                    <MapPin size={18} className="input-icon" />
                    <GooglePlacesAutocomplete
                      value={fromLocation.name}
                      onChange={(name) => setFromLocation((prev) => ({ ...prev, name }))}
                      onPlaceSelect={(place) => setFromLocation(place)}
                      placeholder="e.g. Andheri West, Mumbai"
                      className="input"
                      id="offer-from"
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Drop-off Location *</label>
                  <div className="input-with-icon">
                    <Navigation size={18} className="input-icon" />
                    <GooglePlacesAutocomplete
                      value={toLocation.name}
                      onChange={(name) => setToLocation((prev) => ({ ...prev, name }))}
                      onPlaceSelect={(place) => setToLocation(place)}
                      placeholder="e.g. Bandra Kurla Complex"
                      className="input"
                      id="offer-to"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Waypoints */}
              <div className={styles.waypointsSection}>
                <label className="input-label">Stops Along the Way (optional)</label>
                {waypointsData.map((wp, i) => (
                  <div key={i} className={styles.waypointRow}>
                    <GooglePlacesAutocomplete
                      value={wp.name}
                      onChange={(name) => updateWaypointData(i, { ...wp, name })}
                      onPlaceSelect={(place) => updateWaypointData(i, place)}
                      placeholder={`Stop ${i + 1} — e.g. Vile Parle`}
                      className="input"
                    />
                    {waypointsData.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeWaypoint(i)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className={styles.addBtn} onClick={addWaypoint}>
                  <Plus size={16} /> Add another stop
                </button>
              </div>

              {/* Google Map route preview */}
              {fromLocation.name && toLocation.name && (
                <div style={{ marginTop: '20px' }}>
                  <label className="input-label">Calculated Route & Driving Time</label>
                  <GoogleMapView
                    origin={fromLocation}
                    destination={toLocation}
                    waypoints={waypointsData}
                    height="300px"
                    showRoute={true}
                  />
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <Calendar size={18} /> Schedule
              </h3>
              <div className={styles.formGrid}>
                <div className="input-group">
                  <label className="input-label">Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={form.date}
                    onChange={(e) => update('date', e.target.value)}
                    required
                    id="offer-date"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Time *</label>
                  <input
                    type="time"
                    className="input"
                    value={form.time}
                    onChange={(e) => update('time', e.target.value)}
                    required
                    id="offer-time"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Available Seats *</label>
                  <select
                    className="input"
                    value={form.seats}
                    onChange={(e) => update('seats', parseInt(e.target.value))}
                    id="offer-seats"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} seat{n !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Price per Seat (₹) *</label>
                  <div className="input-with-icon">
                    <IndianRupee size={18} className="input-icon" />
                    <input
                      type="number"
                      className="input"
                      placeholder="e.g. 80"
                      value={form.price}
                      onChange={(e) => update('price', e.target.value)}
                      required
                      min="0"
                      id="offer-price"
                    />
                  </div>
                </div>
              </div>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => update('recurring', e.target.checked)}
                />
                <span>This is a recurring ride (daily commute)</span>
              </label>
            </div>

            {/* Vehicle */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <Car size={18} /> Vehicle Info
              </h3>
              <div className={styles.formGrid}>
                <div className="input-group">
                  <label className="input-label">Vehicle Model *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Hyundai Creta"
                    value={form.vehicleModel}
                    onChange={(e) => update('vehicleModel', e.target.value)}
                    required
                    id="offer-vehicle"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Color</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. White"
                    value={form.vehicleColor}
                    onChange={(e) => update('vehicleColor', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">License Plate</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. MH-02-AB-1234"
                    value={form.vehiclePlate}
                    onChange={(e) => update('vehiclePlate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <Leaf size={18} /> Ride Preferences
              </h3>
              <div className={styles.prefGrid}>
                {PREF_OPTIONS.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    className={`${styles.prefChip} ${prefs.includes(pref) ? styles.prefActive : ''}`}
                    onClick={() => togglePref(pref)}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} id="offer-submit">
              <Route size={20} /> Post Your Ride
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function OfferPage() {
  return (
    <AppProvider>
      <OfferContent />
    </AppProvider>
  );
}
