'use client';

import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar/Navbar';
import RideCard from '@/components/RideCard/RideCard';
import Footer from '@/components/Footer/Footer';
import {
  Car,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
} from 'lucide-react';
import styles from './myrides.module.css';

function MyRidesContent() {
  const {
    rides,
    user,
    acceptRideRequest,
    rejectRideRequest,
    cancelPendingRequest,
    cancelBooking,
  } = useApp();
  const [tab, setTab] = useState('requests');
  const [requestsList, setRequestsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [actionMessage, setActionMessage] = useState(null);

  /* Rides offered in the system */
  const offeredRides = rides;

  /* Load requests & bookings for user */
  const loadData = async () => {
    try {
      // Fetch all requests across rides so driver can accept any request in the app
      let incoming = [];
      for (const ride of rides) {
        const res = await fetch(`/api/rides/${ride.id}/requests?driverId=${ride.driver?.id || user.id}`);
        const data = await res.json();
        if (data.success && data.requests) {
          incoming.push(
            ...data.requests.map((req) => ({
              ...req,
              rideOrigin: ride.from.name,
              rideDestination: ride.to.name,
              driverId: ride.driver?.id || user.id,
            }))
          );
        }
      }
      setRequestsList(incoming);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [rides]);

  const handleAccept = async (req) => {
    const result = await acceptRideRequest(req.id, req.driverId);
    if (result.success) {
      setActionMessage('Request ACCEPTED! Booking confirmed and seat reserved. 🎉');
      await loadData();
    } else {
      setActionMessage(`Error: ${result.message}`);
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleReject = async (requestId) => {
    const result = await rejectRideRequest(requestId);
    if (result.success) {
      setActionMessage('Request REJECTED.');
      await loadData();
    } else {
      setActionMessage(`Error: ${result.message}`);
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          <h1 className="heading-lg">My Rides & Driver Dashboard</h1>

          {actionMessage && (
            <div className={styles.toast} style={{ marginBottom: '20px', padding: '12px 20px', background: 'var(--primary-100)', color: 'var(--primary-800)', borderRadius: '8px', fontWeight: '600' }}>
              {actionMessage}
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'requests' ? styles.active : ''}`}
              onClick={() => setTab('requests')}
              id="tab-requests"
            >
              <AlertCircle size={18} /> Driver Incoming Requests ({requestsList.length})
            </button>
            <button
              className={`${styles.tab} ${tab === 'offered' ? styles.active : ''}`}
              onClick={() => setTab('offered')}
              id="tab-offered"
            >
              <Car size={18} /> My Offered Rides ({offeredRides.length})
            </button>
          </div>

          {/* Incoming Driver Requests */}
          {tab === 'requests' && (
            <div className={styles.list}>
              {requestsList.length > 0 ? (
                requestsList.map((req) => (
                  <div key={req.id} className="card" style={{ padding: '20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>
                        Passenger: {req.passenger_name} (⭐ {req.passenger_rating || 5.0})
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Route: {req.rideOrigin} → {req.rideDestination}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Seats Requested: {req.seats_requested} | Pickup: {req.pickup_location || 'Standard'}
                      </div>
                      {req.message && (
                        <div style={{ fontStyle: 'italic', marginTop: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          "{req.message}"
                        </div>
                      )}
                      <div style={{ marginTop: '8px' }}>
                        <span className="badge" style={{ background: req.status === 'PENDING' ? '#fef3c7' : req.status === 'ACCEPTED' ? '#d1fae5' : '#fee2e2', color: req.status === 'PENDING' ? '#92400e' : req.status === 'ACCEPTED' ? '#065f46' : '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          STATUS: {req.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      {req.status === 'PENDING' ? (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAccept(req)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <UserCheck size={16} /> Accept Request
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleReject(req.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}
                          >
                            <UserX size={16} /> Reject
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          Processed ({req.status})
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>
                  <AlertCircle size={48} className={styles.emptyIcon} />
                  <h3 className="heading-md">No incoming requests yet</h3>
                  <p className="text-base">
                    When passengers request to join your offered rides, their PENDING requests will appear here for your approval.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Offered rides */}
          {tab === 'offered' && (
            <div className={styles.list}>
              {offeredRides.length > 0 ? (
                offeredRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))
              ) : (
                <div className={styles.empty}>
                  <Car size={48} className={styles.emptyIcon} />
                  <h3 className="heading-md">No offered rides yet</h3>
                  <p className="text-base">
                    Share your route and let others ride with you!
                  </p>
                  <a href="/offer" className="btn btn-primary">
                    Offer a Ride
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function MyRidesPage() {
  return (
    <AppProvider>
      <MyRidesContent />
    </AppProvider>
  );
}
