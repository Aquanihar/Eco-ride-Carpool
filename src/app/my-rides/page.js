'use client';

import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar/Navbar';
import RideCard from '@/components/RideCard/RideCard';
import Footer from '@/components/Footer/Footer';
import Link from 'next/link';
import {
  Car,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Bell,
  PlusCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import styles from './myrides.module.css';

function MyRidesContent() {
  const {
    rides,
    user,
    acceptRideRequest,
    rejectRideRequest,
    notifications,
    fetchNotifications,
    fetchRides,
  } = useApp();

  const [tab, setTab] = useState('requests');
  const [requestsList, setRequestsList] = useState([]);
  const [actionMessage, setActionMessage] = useState(null);
  const [simulating, setSimulating] = useState(false);

  /* Load requests for all rides */
  const loadData = async () => {
    try {
      let incoming = [];
      for (const ride of rides) {
        const res = await fetch(`/api/rides/${ride.id}/requests?driverId=${ride.driver?.id || user.id}`);
        const data = await res.json();
        if (data.success && data.requests) {
          incoming.push(
            ...data.requests.map((req) => ({
              ...req,
              rideOrigin: ride.from?.name || ride.origin,
              rideDestination: ride.to?.name || ride.destination,
              driverId: ride.driver?.id || user.id,
              rideSeatsAvailable: ride.seatsAvailable ?? ride.available_seats,
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
    fetchNotifications();
  }, [rides, fetchNotifications]);

  /* Handle Driver Accepting a Ride Request */
  const handleAccept = async (req) => {
    const result = await acceptRideRequest(req.id, req.driverId);
    if (result.success) {
      setActionMessage('🎉 Request ACCEPTED! Booking confirmed and 1 seat reserved in Supabase.');
      await loadData();
      await fetchRides();
      await fetchNotifications();
    } else {
      setActionMessage(`Notice: ${result.message}`);
    }
    setTimeout(() => setActionMessage(null), 5000);
  };

  /* Handle Driver Rejecting a Ride Request */
  const handleReject = async (requestId) => {
    const result = await rejectRideRequest(requestId);
    if (result.success) {
      setActionMessage('Request REJECTED.');
      await loadData();
      await fetchNotifications();
    } else {
      setActionMessage(`Error: ${result.message}`);
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  /* Helper to simulate a passenger requesting a ride */
  const simulatePassengerRequest = async (targetRideId) => {
    setSimulating(true);
    try {
      const ride = rides.find((r) => r.id === targetRideId) || rides[0];
      if (!ride) {
        setActionMessage('Please offer a ride first!');
        setSimulating(false);
        return;
      }

      const passengerNames = ['Aaditya Patel', 'Ananya Sen', 'Priya Rao', 'Vikram Singh'];
      const randomName = passengerNames[Math.floor(Math.random() * passengerNames.length)];

      const res = await fetch(`/api/rides/${ride.id}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerId: `pass_${Date.now()}`,
          passengerName: randomName,
          passengerRating: 4.9,
          seatsRequested: 1,
          pickupLocation: `${ride.from?.name || 'Pickup Point'} (Metro Gate)`,
          dropLocation: ride.to?.name || 'Drop Point',
          message: `Hi, need 1 seat for my daily commute to ${ride.to?.name || 'destination'}.`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage(`🚗 New request sent from passenger ${randomName}! You can now Accept it below.`);
        setTab('requests');
        await loadData();
        await fetchNotifications();
      } else {
        setActionMessage(`Error: ${data.message}`);
      }
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setSimulating(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          <div style={{ marginBottom: '24px' }}>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ShieldCheck size={14} /> Backend: Java 26 + Supabase
            </span>
            <h1 className="heading-lg">Ride Management & Driver Dashboard</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Offer rides, accept passenger booking requests, and track notifications in real-time.
            </p>
          </div>

          {/* Quick Demo Action Banner */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#0284c7" /> Live Feature Test Controls
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '2px' }}>
                Test the complete flow: Offer a ride &rarr; Simulate passenger request &rarr; Accept request &rarr; View notifications.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/offer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={16} /> 1. Offer a Ride
              </Link>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => simulatePassengerRequest(rides[0]?.id)}
                disabled={simulating || rides.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusCircle size={16} /> {simulating ? 'Sending...' : '2. Simulate Passenger Request'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setTab('notifications')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Bell size={16} /> 3. View Notifications ({notifications.length})
              </button>
            </div>
          </div>

          {actionMessage && (
            <div className={styles.toast} style={{ marginBottom: '20px', padding: '14px 20px', background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: '600' }}>
              {actionMessage}
            </div>
          )}

          {/* Navigation Tabs */}
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
              <Car size={18} /> Offered Rides ({rides.length})
            </button>
            <button
              className={`${styles.tab} ${tab === 'notifications' ? styles.active : ''}`}
              onClick={() => setTab('notifications')}
              id="tab-notifications"
            >
              <Bell size={18} /> Notifications ({notifications.length})
            </button>
          </div>

          {/* Tab 1: Driver Incoming Requests */}
          {tab === 'requests' && (
            <div className={styles.list}>
              {requestsList.length > 0 ? (
                requestsList.map((req) => (
                  <div key={req.id} className="card" style={{ padding: '20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ flex: '1', minWidth: '280px' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.15rem', marginBottom: '6px', color: '#0f172a' }}>
                        Passenger: {req.passenger_name} <span style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 'bold' }}>⭐ {req.passenger_rating || 5.0}</span>
                      </div>
                      <div style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '4px' }}>
                        <strong>Route:</strong> {req.rideOrigin} → {req.rideDestination}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        Seats Requested: <strong>{req.seats_requested}</strong> | Pickup: {req.pickup_location || 'Standard'}
                      </div>
                      {req.message && (
                        <div style={{ fontStyle: 'italic', marginTop: '6px', fontSize: '0.9rem', color: '#334155', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px' }}>
                          "{req.message}"
                        </div>
                      )}
                      <div style={{ marginTop: '10px' }}>
                        <span className="badge" style={{ background: req.status === 'PENDING' ? '#fef3c7' : req.status === 'ACCEPTED' ? '#d1fae5' : '#fee2e2', color: req.status === 'PENDING' ? '#92400e' : req.status === 'ACCEPTED' ? '#065f46' : '#991b1b', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          STATUS: {req.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {req.status === 'PENDING' ? (
                        <>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleAccept(req)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#059669', borderColor: '#059669', fontWeight: '700' }}
                          >
                            <UserCheck size={18} /> Accept Request
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleReject(req.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}
                          >
                            <UserX size={18} /> Reject
                          </button>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '700', fontSize: '0.95rem', background: '#ecfdf5', padding: '8px 14px', borderRadius: '8px' }}>
                          <CheckCircle2 size={18} /> Booking Confirmed & Seat Reserved
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>
                  <AlertCircle size={48} className={styles.emptyIcon} />
                  <h3 className="heading-md">No incoming requests right now</h3>
                  <p className="text-base" style={{ marginBottom: '16px' }}>
                    Click the button below to simulate an incoming passenger request and test accepting it!
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => simulatePassengerRequest(rides[0]?.id)}
                    disabled={simulating || rides.length === 0}
                  >
                    <PlusCircle size={18} /> {simulating ? 'Sending...' : 'Simulate Incoming Passenger Request'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Offered Rides */}
          {tab === 'offered' && (
            <div className={styles.list}>
              {rides.length > 0 ? (
                rides.map((ride) => (
                  <div key={ride.id} style={{ marginBottom: '20px' }}>
                    <RideCard ride={ride} />
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => simulatePassengerRequest(ride.id)}
                        disabled={simulating || (ride.seatsAvailable <= 0)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <PlusCircle size={16} /> Request 1 Seat on this Ride (as Passenger)
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>
                  <Car size={48} className={styles.emptyIcon} />
                  <h3 className="heading-md">No offered rides yet</h3>
                  <p className="text-base" style={{ marginBottom: '16px' }}>
                    Share your route and let others ride with you!
                  </p>
                  <Link href="/offer" className="btn btn-primary">
                    Offer a Ride Now
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Notifications */}
          {tab === 'notifications' && (
            <div className={styles.list}>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="card"
                    style={{ padding: '16px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #0284c7' }}
                  >
                    <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '10px', borderRadius: '50%' }}>
                      <Bell size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>
                        {n.title}
                      </div>
                      <div style={{ color: '#475569', fontSize: '0.92rem', marginTop: '2px' }}>
                        {n.message}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>
                  <Bell size={48} className={styles.emptyIcon} />
                  <h3 className="heading-md">No notifications yet</h3>
                  <p className="text-base">
                    When you offer rides, receive requests, or accept them, live alerts will appear here!
                  </p>
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
