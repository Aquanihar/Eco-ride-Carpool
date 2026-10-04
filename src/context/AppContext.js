'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [rides, setRides] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({
    id: 'u_passenger_demo',
    name: 'Rahul Verma',
    email: 'rahul.verma@example.com',
    phone: '9876543210',
    rating: 4.9,
    trips: 18,
    co2Saved: 32,
    moneySaved: 1850,
    isDriver: false,
  });
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [driverIncomingRequests, setDriverIncomingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  /* Fetch rides from backend API */
  const fetchRides = useCallback(async () => {
    try {
      const res = await fetch('/api/rides');
      const data = await res.json();
      if (data.success && data.rides) {
        // Map backend schema to UI format
        const mappedRides = data.rides.map((r) => ({
          id: r.id,
          driver: {
            id: r.driver_id || r.driver?.id,
            name: r.driver?.name || 'Verified Driver',
            rating: r.driver?.rating || 4.8,
            trips: r.driver?.total_ratings || 24,
            verified: true,
          },
          from: { name: r.origin, lat: r.origin_latitude, lng: r.origin_longitude },
          to: { name: r.destination, lat: r.destination_latitude, lng: r.destination_longitude },
          waypoints: r.waypoints || [],
          date: r.departure_date,
          time: r.departure_time,
          seats: r.total_seats,
          seatsAvailable: r.available_seats,
          price: r.price_per_seat,
          vehicle: {
            model: r.vehicle?.model || 'Sedan',
            color: r.vehicle?.color || 'White',
            plate: r.vehicle?.registration_number || 'MH-01',
          },
          preferences: ['No Smoking', 'Music OK'],
          status: r.status === 'PUBLISHED' ? 'active' : r.status,
        }));
        setRides(mappedRides);
      }
    } catch (e) {
      console.error('Error fetching rides:', e);
    }
  }, []);

  /* Fetch User Notifications */
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      const data = await res.json();
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  }, [user.id]);

  useEffect(() => {
    fetchRides();
    fetchNotifications();
  }, [fetchRides, fetchNotifications]);

  /* Log in / register user */
  const loginUser = useCallback((userData) => {
    const updatedUser = {
      ...user,
      id: userData.id || `u_${Date.now()}`,
      name: userData.fullName || userData.name || user.name,
      email: userData.email || user.email,
      phone: userData.phone || user.phone,
    };
    setUser(updatedUser);
    setIsLoggedIn(true);
  }, [user]);

  /* Search rides */
  const searchRides = useCallback((from, to, date) => {
    return rides.filter((ride) => {
      const dateMatch = !date || ride.date === date;
      const hasSeats = ride.seatsAvailable > 0;
      const isActive = ride.status === 'active';
      if (!dateMatch || !hasSeats || !isActive) return false;

      const query = `${from || ''} ${to || ''}`.toLowerCase().trim();
      if (!query) return true;
      const rideText = `${ride.from?.name || ''} ${ride.to?.name || ''}`.toLowerCase();
      return query.split(' ').some((word) => word.length > 2 && rideText.includes(word));
    });
  }, [rides]);

  /* Post a new ride (Driver) */
  const postRide = useCallback(async (rideData) => {
    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: user.id,
          driverName: user.name,
          origin: rideData.from.name,
          destination: rideData.to.name,
          departureDate: rideData.date,
          departureTime: rideData.time,
          totalSeats: rideData.seats,
          pricePerSeat: rideData.price,
          vehicleModel: rideData.vehicle?.model,
          vehicleColor: rideData.vehicle?.color,
          vehiclePlate: rideData.vehicle?.plate,
          waypoints: rideData.waypoints,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchRides();
        return data.ride;
      }
    } catch (e) {
      console.error('Error posting ride:', e);
    }
  }, [user, fetchRides]);

  /* Send Ride Request (Passenger) -> Requests PENDING state, NO seat deduction yet */
  const sendRideRequest = useCallback(async (rideId, seatsRequested = 1, pickupLocation = '', dropLocation = '', message = '') => {
    try {
      const res = await fetch(`/api/rides/${rideId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerId: user.id,
          passengerName: user.name,
          passengerRating: user.rating,
          seatsRequested,
          pickupLocation,
          dropLocation,
          message,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRequests((prev) => [data.request, ...prev]);
        await fetchNotifications();
        return { success: true, request: data.request, message: data.message };
      } else {
        return { success: false, message: data.message, errorCode: data.errorCode };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [user, fetchNotifications]);

  /* Accept Ride Request (Driver) -> Deducts seat & Creates CONFIRMED booking */
  const acceptRideRequest = useCallback(async (requestId, targetDriverId) => {
    try {
      const res = await fetch(`/api/ride-requests/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: targetDriverId || user.id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchRides();
        await fetchNotifications();
        return { success: true, data: data.data, message: data.message };
      } else {
        return { success: false, message: data.message, errorCode: data.errorCode };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [user.id, fetchRides, fetchNotifications]);

  /* Reject Ride Request (Driver) -> No seat deduction */
  const rejectRideRequest = useCallback(async (requestId) => {
    try {
      const res = await fetch(`/api/ride-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchNotifications();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [user.id, fetchNotifications]);

  /* Cancel Pending Request (Passenger) */
  const cancelPendingRequest = useCallback(async (requestId) => {
    try {
      const res = await fetch(`/api/ride-requests/${requestId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passengerId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [user.id]);

  /* Cancel Confirmed Booking (Passenger) -> Releases seat back */
  const cancelBooking = useCallback(async (bookingId) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passengerId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchRides();
        await fetchNotifications();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [user.id, fetchRides, fetchNotifications]);

  /* Driver Cancel Ride */
  const cancelRide = useCallback(async (rideId) => {
    try {
      const res = await fetch(`/api/rides/${rideId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchRides();
        await fetchNotifications();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [user.id, fetchRides, fetchNotifications]);

  const markNotificationRead = useCallback((notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true, read: true } : n))
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read && !n.read).length;

  return (
    <AppContext.Provider
      value={{
        rides,
        user,
        setUser,
        isLoggedIn,
        loginUser,
        bookings,
        requests,
        notifications,
        unreadCount,
        searchRides,
        postRide,
        sendRideRequest,
        acceptRideRequest,
        rejectRideRequest,
        cancelPendingRequest,
        cancelBooking,
        cancelRide,
        fetchRides,
        markNotificationRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
