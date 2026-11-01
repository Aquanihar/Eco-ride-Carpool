'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export const AppContext = createContext(null);

export const DEMO_PROFILES = {
  driverA: {
    id: 'u_driver_a',
    name: 'Driver A (Aarav)',
    email: 'driver.a@example.com',
    phone: '9876500001',
    rating: 4.9,
    trips: 42,
    co2Saved: 160,
    moneySaved: 5400,
    isDriver: true,
  },
  passengerB: {
    id: 'u_passenger_b',
    name: 'Passenger B (Priya)',
    email: 'passenger.b@example.com',
    phone: '9876500002',
    rating: 4.8,
    trips: 12,
    co2Saved: 24,
    moneySaved: 1200,
    isDriver: false,
  },
};

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
  const [notifications, setNotifications] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Restore authenticated session from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('raahi_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) {
            setUser(parsed);
            setIsLoggedIn(true);
          }
        }
      } catch (e) {
        console.warn('Failed to load user from localStorage:', e);
      }
    }
  }, []);

  /* Fetch rides from backend API (Central Database) */
  const fetchRides = useCallback(async (filters = {}) => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (filters.origin) params.append('origin', filters.origin);
      if (filters.destination) params.append('destination', filters.destination);
      if (filters.date) params.append('date', filters.date);
      if (filters.passengerCount) params.append('passengerCount', filters.passengerCount);

      const qs = params.toString();
      const url = qs ? `/api/rides?${qs}` : '/api/rides';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();

      if (data.success && data.rides) {
        // Map backend central DB schema to UI format
        const mappedRides = data.rides.map((r) => {
          const originName = r.origin || r.from?.name || r.from || 'Starting Point';
          const destName = r.destination || r.to?.name || r.to || 'Destination';
          const driverId = r.driver_id || r.driverId || r.driver?.id || 'u_driver';
          const driverName = r.driver?.name || r.driverName || 'Verified Driver';
          const totalSeats = Number(r.total_seats || r.totalSeats || r.seats || 3);
          const availSeats = Number(r.available_seats ?? r.availableSeats ?? r.seatsAvailable ?? totalSeats);
          const price = Number(r.price_per_seat || r.pricePerSeat || r.price || 50);

          return {
            id: r.id,
            driver: {
              id: driverId,
              name: driverName,
              rating: Number(r.driver?.rating || 4.8),
              trips: Number(r.driver?.total_ratings || 24),
              verified: true,
            },
            from: {
              name: originName,
              lat: r.origin_latitude || r.from?.lat || null,
              lng: r.origin_longitude || r.from?.lng || null,
            },
            to: {
              name: destName,
              lat: r.destination_latitude || r.to?.lat || null,
              lng: r.destination_longitude || r.to?.lng || null,
            },
            waypoints: Array.isArray(r.waypoints) ? r.waypoints : [],
            date: r.departure_date || r.date,
            time: r.departure_time || r.time,
            seats: totalSeats,
            seatsAvailable: availSeats,
            price: price,
            vehicle: {
              model: r.vehicle?.model || r.vehicleModel || 'Standard Sedan',
              color: r.vehicle?.color || r.vehicleColor || 'White',
              plate: r.vehicle?.registration_number || r.vehiclePlate || 'MH-01',
            },
            preferences: r.preferences || ['No Smoking', 'Music OK'],
            status: r.status === 'PUBLISHED' ? 'active' : r.status,
          };
        });

        setRides(mappedRides);
        return mappedRides;
      }
    } catch (e) {
      console.error('Error fetching rides from backend:', e);
    } finally {
      setIsSearching(false);
    }
    return [];
  }, []);

  /* Fetch User Notifications */
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  }, [user?.id]);

  /* Fetch Passenger Requests */
  const fetchPassengerRequests = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/ride-requests?passengerId=${user.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.requests) {
        setRequests(data.requests);
      }
    } catch (e) {
      console.error('Error fetching passenger requests:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchPassengerRequests();
    }
  }, [user?.id, fetchNotifications, fetchPassengerRequests]);

  /* Log in user & persist to localStorage */
  const loginUser = useCallback((userData) => {
    let savedPendingName = '';
    if (typeof window !== 'undefined') {
      try {
        savedPendingName = localStorage.getItem('raahi_pending_name') || '';
      } catch (e) {}
    }
    const enteredName = (userData.fullName || userData.name || savedPendingName || user.name || 'User').trim();
    const updatedUser = {
      ...user,
      id: userData.id || (userData.email ? `u_${userData.email.replace(/[^a-zA-Z0-9]/g, '_')}` : `u_${Date.now()}`),
      name: enteredName,
      fullName: enteredName,
      email: userData.email || user.email,
      phone: userData.phone || user.phone,
      isDriver: userData.isDriver ?? true,
    };
    setUser(updatedUser);
    setIsLoggedIn(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('raahi_user', JSON.stringify(updatedUser));
      } catch (e) {}
    }
  }, [user]);

  /* Switch demo user profile (Driver A <-> Passenger B) */
  const switchUser = useCallback((profile) => {
    setUser(profile);
    setIsLoggedIn(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('raahi_user', JSON.stringify(profile));
      } catch (e) {}
    }
  }, []);

  /* Log out */
  const logoutUser = useCallback(() => {
    const defaultUser = {
      id: 'u_guest_' + Date.now().toString(36),
      name: 'Guest User',
      email: 'guest@example.com',
      phone: '9876543210',
      rating: 5.0,
      trips: 0,
      co2Saved: 0,
      moneySaved: 0,
      isDriver: false,
    };
    setUser(defaultUser);
    setIsLoggedIn(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('raahi_user');
        localStorage.removeItem('raahi_pending_name');
        sessionStorage.setItem('raahi_launched', 'true');
        window.location.href = '/';
      } catch (e) {
        window.location.href = '/';
      }
    }
  }, []);

  /* Synchronous helper to search cached rides */
  const searchRides = useCallback((from, to, date) => {
    return rides.filter((ride) => {
      const dateMatch = !date || ride.date === date;
      const hasSeats = ride.seatsAvailable > 0;
      const isActive = ride.status === 'active';
      if (!hasSeats || !isActive) return false;
      if (date && !dateMatch) return false;

      const fromQuery = (from || '').toLowerCase().trim();
      const toQuery = (to || '').toLowerCase().trim();

      if (fromQuery) {
        const fromMatch =
          ride.from?.name?.toLowerCase().includes(fromQuery) ||
          ride.waypoints?.some((w) => (typeof w === 'string' ? w : w.name || '').toLowerCase().includes(fromQuery));
        if (!fromMatch) return false;
      }

      if (toQuery) {
        const toMatch =
          ride.to?.name?.toLowerCase().includes(toQuery) ||
          ride.waypoints?.some((w) => (typeof w === 'string' ? w : w.name || '').toLowerCase().includes(toQuery));
        if (!toMatch) return false;
      }

      return true;
    });
  }, [rides]);

  /* Post a new ride (Driver) -> Central Database */
  const postRide = useCallback(async (rideData) => {
    try {
      const payload = {
        driverId: user.id,
        driverName: user.name,
        origin: typeof rideData.from === 'object' ? rideData.from.name : rideData.from,
        destination: typeof rideData.to === 'object' ? rideData.to.name : rideData.to,
        departureDate: rideData.date,
        departureTime: rideData.time,
        totalSeats: Number(rideData.seats),
        pricePerSeat: Number(rideData.price),
        vehicleModel: rideData.vehicle?.model,
        vehicleColor: rideData.vehicle?.color,
        vehiclePlate: rideData.vehicle?.plate,
        waypoints: rideData.waypoints || [],
        preferences: rideData.preferences || [],
      };

      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  /* Send Ride Request (Passenger) -> Status = PENDING */
  const sendRideRequest = useCallback(async (rideId, seatsRequested = 1, pickupLocation = '', dropLocation = '', message = '') => {
    try {
      let currentName = user?.name || user?.fullName;
      let currentId = user?.id;
      let currentRating = user?.rating || 5.0;

      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('raahi_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.name) currentName = parsed.name;
            else if (parsed.fullName) currentName = parsed.fullName;
            if (parsed.id) currentId = parsed.id;
            if (parsed.rating) currentRating = parsed.rating;
          } else {
            const pendingName = localStorage.getItem('raahi_pending_name');
            if (pendingName) currentName = pendingName;
          }
        } catch (e) {}
      }

      const passengerName = currentName || user?.name || 'Passenger';

      const res = await fetch(`/api/rides/${rideId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerId: currentId || user.id,
          passengerName: passengerName,
          passengerRating: currentRating,
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
        await fetchPassengerRequests();
        return { success: true, request: data.request, message: data.message };
      } else {
        return { success: false, message: data.message, errorCode: data.errorCode };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [user, fetchNotifications, fetchPassengerRequests]);

  /* Accept Ride Request (Driver) -> Status = ACCEPTED & Seats Decremented */
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

  /* Reject Ride Request (Driver) */
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

  /* Cancel Confirmed Booking (Passenger) */
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

  /* Cancel Ride (Driver) */
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
        logoutUser,
        switchUser,
        DEMO_PROFILES,
        bookings,
        requests,
        notifications,
        unreadCount,
        isSearching,
        searchRides,
        postRide,
        sendRideRequest,
        acceptRideRequest,
        rejectRideRequest,
        cancelPendingRequest,
        cancelBooking,
        cancelRide,
        fetchRides,
        fetchNotifications,
        fetchPassengerRequests,
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
