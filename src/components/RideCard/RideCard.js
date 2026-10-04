'use client';

import {
  MapPin,
  Navigation,
  Clock,
  Users,
  Star,
  Shield,
  Car,
  Leaf,
  ChevronRight,
  CircleDot,
} from 'lucide-react';
import styles from './RideCard.module.css';

export default function RideCard({ ride, onBook, onView }) {
  const {
    driver,
    from,
    to,
    waypoints,
    date,
    time,
    seatsAvailable,
    price,
    vehicle,
    preferences,
  } = ride;

  const formatDate = (d) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`card ${styles.rideCard}`} id={`ride-${ride.id}`}>
      {/* Top row: Driver info + Price */}
      <div className={styles.topRow}>
        <div className={styles.driverInfo}>
          <div className={styles.avatar}>
            {driver.name.charAt(0)}
          </div>
          <div>
            <div className={styles.driverName}>
              {driver.name}
              {driver.verified && (
                <Shield size={14} className={styles.verifiedIcon} />
              )}
            </div>
            <div className={styles.driverMeta}>
              <Star size={12} className={styles.starIcon} />
              <span>{driver.rating}</span>
              <span className={styles.dot}>·</span>
              <span>{driver.trips} trips</span>
            </div>
          </div>
        </div>
        <div className={styles.priceBlock}>
          <span className={styles.price}>₹{price}</span>
          <span className={styles.priceLabel}>per seat</span>
        </div>
      </div>

      {/* Route */}
      <div className={styles.route}>
        <div className={styles.routeTimeline}>
          <div className={styles.routeDot} style={{ background: 'var(--primary-400)' }} />
          <div className={styles.routeLine} />
          {waypoints.map((_, i) => (
            <span key={i}>
              <div className={styles.routeWaypoint} />
              <div className={styles.routeLine} />
            </span>
          ))}
          <div className={styles.routeDot} style={{ background: 'var(--accent-400)' }} />
        </div>
        <div className={styles.routeDetails}>
          <div className={styles.routePoint}>
            <span className={styles.routeName}>{from.name}</span>
          </div>
          {waypoints.map((wp, i) => (
            <div key={i} className={styles.routeWaypointLabel}>
              <span>{wp.name}</span>
            </div>
          ))}
          <div className={styles.routePoint}>
            <span className={styles.routeName}>{to.name}</span>
          </div>
        </div>
      </div>

      {/* Bottom row: meta + actions */}
      <div className={styles.bottomRow}>
        <div className={styles.metaTags}>
          <span className={styles.metaTag}>
            <Clock size={14} />
            {formatDate(date)} · {time}
          </span>
          <span className={styles.metaTag}>
            <Users size={14} />
            {seatsAvailable} seat{seatsAvailable !== 1 ? 's' : ''} left
          </span>
          <span className={styles.metaTag}>
            <Car size={14} />
            {vehicle.model}
          </span>
        </div>
        <div className={styles.actions}>
          {onView && (
            <button className="btn btn-secondary btn-sm" onClick={() => onView(ride)} id={`view-${ride.id}`}>
              Details
            </button>
          )}
          {onBook && seatsAvailable > 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => onBook(ride.id)} id={`book-${ride.id}`}>
              Book Seat
            </button>
          )}
        </div>
      </div>

      {/* Preferences */}
      {preferences.length > 0 && (
        <div className={styles.prefs}>
          {preferences.map((pref, i) => (
            <span key={i} className={styles.prefTag}>
              {pref}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
