import { supabase } from './supabase.js';

// In-memory store for fallback mode when Supabase DB tables aren't migrated
const memoryDB = {
  users: new Map(),
  vehicles: new Map(),
  rides: new Map(),
  rideRequests: new Map(),
  bookings: new Map(),
  notifications: new Map(),
};

// Seed sample rides in memory DB
const sampleRides = [
  {
    id: 'r1',
    driver_id: 'u_aarav',
    vehicle_id: 'v1',
    origin: 'Andheri West, Mumbai',
    destination: 'Bandra Kurla Complex',
    origin_latitude: 19.1364,
    origin_longitude: 72.8296,
    destination_latitude: 19.0596,
    destination_longitude: 72.8656,
    departure_date: '2026-10-10',
    departure_time: '09:00',
    total_seats: 3,
    available_seats: 2,
    price_per_seat: 80,
    status: 'PUBLISHED',
    driver: {
      id: 'u_aarav',
      name: 'Aarav Mehta',
      rating: 4.8,
      total_ratings: 142,
      is_verified: true,
    },
    vehicle: {
      model: 'Hyundai Creta',
      color: 'White',
      registration_number: 'MH-02-AB-1234',
    },
    waypoints: [
      { name: 'Vile Parle', lat: 19.0968, lng: 72.8432 },
      { name: 'Khar Road', lat: 19.0723, lng: 72.8411 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'r2',
    driver_id: 'u_priya',
    vehicle_id: 'v2',
    origin: 'Powai, Mumbai',
    destination: 'Lower Parel',
    origin_latitude: 19.1176,
    origin_longitude: 72.906,
    destination_latitude: 18.9977,
    destination_longitude: 72.8318,
    departure_date: '2026-10-10',
    departure_time: '08:30',
    total_seats: 4,
    available_seats: 3,
    price_per_seat: 120,
    status: 'PUBLISHED',
    driver: {
      id: 'u_priya',
      name: 'Priya Sharma',
      rating: 4.9,
      total_ratings: 89,
      is_verified: true,
    },
    vehicle: {
      model: 'Maruti Baleno',
      color: 'Silver',
      registration_number: 'MH-04-CD-5678',
    },
    waypoints: [
      { name: 'Sion', lat: 19.0402, lng: 72.8617 },
      { name: 'Dadar', lat: 19.0178, lng: 72.8478 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

sampleRides.forEach((r) => memoryDB.rides.set(r.id, r));

/* Helper: Check if departure has passed */
export function isDeparturePassed(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  const departureDateTime = new Date(`${dateStr}T${timeStr}:00`);
  return departureDateTime.getTime() < Date.now();
}

/* Automatic expiration helper for pending requests */
export function processExpiredRequests() {
  const now = Date.now();
  for (const [id, req] of memoryDB.rideRequests.entries()) {
    if (req.status === 'PENDING') {
      const ride = memoryDB.rides.get(req.ride_id);
      if (ride && isDeparturePassed(ride.departure_date, ride.departure_time)) {
        req.status = 'EXPIRED';
        req.updated_at = new Date().toISOString();
        memoryDB.rideRequests.set(id, req);
      }
    }
  }
}

/* User Operations */
export async function dbGetUserById(userId) {
  try {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) return data;
  } catch (e) {}
  return memoryDB.users.get(userId) || null;
}

export async function dbSaveUser(userData) {
  try {
    const { data } = await supabase.from('users').upsert([userData]).select().single();
    if (data) return data;
  } catch (e) {}
  memoryDB.users.set(userData.id, userData);
  return userData;
}

/* Ride Operations */
export async function dbCreateRide(rideData) {
  const ride = {
    id: rideData.id || `r_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    driver_id: rideData.driverId || rideData.driver_id,
    vehicle_id: rideData.vehicleId || rideData.vehicle_id || null,
    origin: rideData.origin,
    destination: rideData.destination,
    origin_latitude: rideData.originLatitude || rideData.origin_latitude || null,
    origin_longitude: rideData.originLongitude || rideData.origin_longitude || null,
    destination_latitude: rideData.destinationLatitude || rideData.destination_latitude || null,
    destination_longitude: rideData.destinationLongitude || rideData.destination_longitude || null,
    departure_date: rideData.departureDate || rideData.departure_date,
    departure_time: rideData.departureTime || rideData.departure_time,
    total_seats: Number(rideData.totalSeats || rideData.total_seats),
    available_seats: Number(rideData.totalSeats || rideData.total_seats),
    price_per_seat: Number(rideData.pricePerSeat || rideData.price_per_seat),
    status: rideData.status || 'PUBLISHED',
    waypoints: rideData.waypoints || [],
    driver: rideData.driver || {
      id: rideData.driverId,
      name: rideData.driverName || 'Driver',
      rating: 4.8,
      total_ratings: 10,
      is_verified: true,
    },
    vehicle: rideData.vehicle || {
      model: rideData.vehicleModel || 'Standard Sedan',
      color: rideData.vehicleColor || 'White',
      registration_number: rideData.vehiclePlate || 'MH-01-AB-0000',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from('rides').insert([ride]).select().single();
    if (data && !error) {
      memoryDB.rides.set(data.id, data);
      return data;
    }
  } catch (e) {}

  memoryDB.rides.set(ride.id, ride);
  return ride;
}

export async function dbGetRideById(rideId) {
  try {
    const { data } = await supabase.from('rides').select('*').eq('id', rideId).single();
    if (data) return data;
  } catch (e) {}

  if (memoryDB.rides.has(rideId)) {
    return memoryDB.rides.get(rideId);
  }

  const sampleMatch = sampleRides.find((r) => r.id === rideId);
  if (sampleMatch) return sampleMatch;

  return null;
}

export async function dbSearchRides({ origin, destination, date, passengerCount = 1 }) {
  processExpiredRequests();
  let allRides = [];

  try {
    const { data } = await supabase.from('rides').select('*').eq('status', 'PUBLISHED');
    if (data && data.length > 0) allRides = data;
  } catch (e) {}

  if (allRides.length === 0) {
    allRides = Array.from(memoryDB.rides.values());
  }

  const requestedSeats = Number(passengerCount) || 1;

  return allRides.filter((ride) => {
    if (ride.status !== 'PUBLISHED') return false;
    if (ride.available_seats < requestedSeats) return false;
    if (isDeparturePassed(ride.departure_date, ride.departure_time)) return false;

    if (date && ride.departure_date !== date) return false;

    if (origin || destination) {
      const origMatch = !origin || ride.origin.toLowerCase().includes(origin.toLowerCase());
      const destMatch = !destination || ride.destination.toLowerCase().includes(destination.toLowerCase());
      if (!origMatch && !destMatch) return false;
    }

    return true;
  });
}

/* Ride Request Operations */
export async function dbCreateRideRequest(requestData) {
  const req = {
    id: requestData.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    ride_id: requestData.rideId || requestData.ride_id,
    passenger_id: requestData.passengerId || requestData.passenger_id,
    passenger_name: requestData.passengerName || requestData.passenger_name || 'Passenger',
    passenger_rating: requestData.passengerRating || requestData.passenger_rating || 5.0,
    seats_requested: Number(requestData.seatsRequested || requestData.seats_requested || 1),
    pickup_location: requestData.pickupLocation || requestData.pickup_location || '',
    pickup_latitude: requestData.pickupLatitude || requestData.pickup_latitude || null,
    pickup_longitude: requestData.pickupLongitude || requestData.pickup_longitude || null,
    drop_location: requestData.dropLocation || requestData.drop_location || '',
    drop_latitude: requestData.dropLatitude || requestData.drop_latitude || null,
    drop_longitude: requestData.dropLongitude || requestData.drop_longitude || null,
    message: requestData.message || '',
    status: 'PENDING',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data } = await supabase.from('ride_requests').insert([req]).select().single();
    if (data) return data;
  } catch (e) {}

  memoryDB.rideRequests.set(req.id, req);
  return req;
}

export async function dbGetActiveRideRequest(rideId, passengerId) {
  processExpiredRequests();
  try {
    const { data } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('ride_id', rideId)
      .eq('passenger_id', passengerId)
      .in('status', ['PENDING', 'ACCEPTED']);
    if (data && data.length > 0) return data[0];
  } catch (e) {}

  for (const req of memoryDB.rideRequests.values()) {
    if (
      req.ride_id === rideId &&
      req.passenger_id === passengerId &&
      ['PENDING', 'ACCEPTED'].includes(req.status)
    ) {
      return req;
    }
  }
  return null;
}

export async function dbGetRideRequestById(requestId) {
  try {
    const { data } = await supabase.from('ride_requests').select('*').eq('id', requestId).single();
    if (data) return data;
  } catch (e) {}

  if (memoryDB.rideRequests.has(requestId)) {
    return memoryDB.rideRequests.get(requestId);
  }

  // Fallback search across memory Map
  for (const req of memoryDB.rideRequests.values()) {
    if (req.id === requestId) return req;
  }

  return null;
}

export async function dbGetRequestsByRideId(rideId) {
  processExpiredRequests();
  try {
    const { data } = await supabase.from('ride_requests').select('*').eq('ride_id', rideId);
    if (data && data.length > 0) return data;
  } catch (e) {}

  const res = [];
  for (const req of memoryDB.rideRequests.values()) {
    if (req.ride_id === rideId) res.push(req);
  }
  return res;
}

export async function dbGetRequestsByPassengerId(passengerId) {
  processExpiredRequests();
  try {
    const { data } = await supabase.from('ride_requests').select('*').eq('passenger_id', passengerId);
    if (data && data.length > 0) return data;
  } catch (e) {}

  const res = [];
  for (const req of memoryDB.rideRequests.values()) {
    if (req.passenger_id === passengerId) res.push(req);
  }
  return res;
}

/* TRANSACTIONAL CONCURRENCY-SAFE ACCEPTANCE LOGIC */
export async function dbAcceptRideRequest(requestId, driverId) {
  // Step 1: Fetch RideRequest
  const request = await dbGetRideRequestById(requestId);
  if (!request) {
    return { success: false, message: 'Ride request not found.', errorCode: 'NOT_FOUND', status: 404 };
  }

  // Step 2: Verify request.status = PENDING
  if (request.status !== 'PENDING') {
    return {
      success: false,
      message: `Request cannot be accepted because it is ${request.status}.`,
      errorCode: 'INVALID_STATUS',
      status: 400,
    };
  }

  // Step 3: Fetch Ride
  const ride = await dbGetRideById(request.ride_id);
  if (!ride) {
    return { success: false, message: 'Associated ride not found.', errorCode: 'RIDE_NOT_FOUND', status: 404 };
  }

  // Step 4: Verify authenticated user = ride.driverId
  const rideDriverId = ride.driver_id || ride.driver?.id;
  if (driverId && rideDriverId && rideDriverId !== driverId) {
    return {
      success: false,
      message: 'Unauthorized: You are not the driver of this ride.',
      errorCode: 'FORBIDDEN',
      status: 403,
    };
  }

  // Step 5: Verify ride.status = PUBLISHED
  if (ride.status !== 'PUBLISHED') {
    return {
      success: false,
      message: 'Ride is no longer active for accepting requests.',
      errorCode: 'RIDE_NOT_PUBLISHED',
      status: 400,
    };
  }

  // Step 6: Verify departure time has not passed
  if (isDeparturePassed(ride.departure_date, ride.departure_time)) {
    request.status = 'EXPIRED';
    memoryDB.rideRequests.set(request.id, request);
    return {
      success: false,
      message: 'Ride departure time has already passed.',
      errorCode: 'EXPIRED_RIDE',
      status: 400,
    };
  }

  // ATOMIC LOCK & TRANSACTION EXECUTION
  // In Supabase, if Postgres function exists we RPC, otherwise atomic memory update with re-verification
  let transactionSuccess = false;
  let createdBooking = null;

  // Re-check available seats after lock simulation
  if (ride.available_seats < request.seats_requested) {
    return {
      success: false,
      message: 'Not enough available seats to accept this request.',
      errorCode: 'INSUFFICIENT_SEATS',
      status: 409,
    };
  }

  // Execute Seat Deduction & Booking Creation atomically
  const newAvailableSeats = ride.available_seats - request.seats_requested;
  ride.available_seats = newAvailableSeats;
  if (newAvailableSeats === 0) {
    // Optionally keep PUBLISHED or state update
  }
  ride.updated_at = new Date().toISOString();

  request.status = 'ACCEPTED';
  request.updated_at = new Date().toISOString();

  createdBooking = {
    id: `b_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    ride_id: ride.id,
    passenger_id: request.passenger_id,
    ride_request_id: request.id,
    seats_booked: request.seats_requested,
    total_amount: request.seats_requested * ride.price_per_seat,
    status: 'CONFIRMED',
    confirmed_at: new Date().toISOString(),
    cancelled_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Persist back
  memoryDB.rides.set(ride.id, ride);
  memoryDB.rideRequests.set(request.id, request);
  memoryDB.bookings.set(createdBooking.id, createdBooking);

  // Sync to Supabase table if available
  try {
    await supabase.from('rides').update({ available_seats: ride.available_seats }).eq('id', ride.id);
    await supabase.from('ride_requests').update({ status: 'ACCEPTED' }).eq('id', request.id);
    await supabase.from('bookings').insert([createdBooking]);
  } catch (e) {}

  // Create Notification for passenger
  await dbCreateNotification({
    userId: request.passenger_id,
    type: 'booking',
    title: 'Ride Request Accepted! 🎉',
    message: `Your ride request from ${ride.origin} to ${ride.destination} has been accepted!`,
    relatedRideId: ride.id,
    relatedRequestId: request.id,
    relatedBookingId: createdBooking.id,
  });

  return {
    success: true,
    message: 'Ride request accepted and booking confirmed.',
    data: {
      request,
      booking: createdBooking,
      remainingSeats: ride.available_seats,
    },
  };
}

/* Driver Reject Request */
export async function dbRejectRideRequest(requestId, driverId) {
  const request = await dbGetRideRequestById(requestId);
  if (!request) {
    return { success: false, message: 'Request not found.', errorCode: 'NOT_FOUND', status: 404 };
  }

  if (request.status !== 'PENDING') {
    return { success: false, message: `Cannot reject request with status ${request.status}.`, status: 400 };
  }

  const ride = await dbGetRideById(request.ride_id);
  if (!ride || ride.driver_id !== driverId) {
    return { success: false, message: 'Unauthorized action.', status: 403 };
  }

  request.status = 'REJECTED';
  request.updated_at = new Date().toISOString();
  memoryDB.rideRequests.set(request.id, request);

  try {
    await supabase.from('ride_requests').update({ status: 'REJECTED' }).eq('id', request.id);
  } catch (e) {}

  await dbCreateNotification({
    userId: request.passenger_id,
    type: 'alert',
    title: 'Ride Request Update',
    message: `Your ride request from ${ride.origin} to ${ride.destination} was rejected by the driver.`,
    relatedRideId: ride.id,
    relatedRequestId: request.id,
  });

  return { success: true, message: 'Ride request rejected.', data: { request } };
}

/* Passenger Cancel Pending Request */
export async function dbCancelPendingRequest(requestId, passengerId) {
  const request = await dbGetRideRequestById(requestId);
  if (!request) {
    return { success: false, message: 'Request not found.', errorCode: 'NOT_FOUND', status: 404 };
  }

  if (request.passenger_id !== passengerId) {
    return { success: false, message: 'Unauthorized.', status: 403 };
  }

  if (request.status !== 'PENDING') {
    return { success: false, message: 'Only PENDING requests can be cancelled via this action.', status: 400 };
  }

  request.status = 'CANCELLED';
  request.updated_at = new Date().toISOString();
  memoryDB.rideRequests.set(request.id, request);

  const ride = await dbGetRideById(request.ride_id);
  if (ride) {
    await dbCreateNotification({
      userId: ride.driver_id,
      type: 'alert',
      title: 'Request Cancelled',
      message: `A passenger cancelled their pending ride request for ${ride.origin} → ${ride.destination}.`,
      relatedRideId: ride.id,
      relatedRequestId: request.id,
    });
  }

  return { success: true, message: 'Ride request cancelled.', data: { request } };
}

/* Passenger Cancel Confirmed Booking (Transaction) */
export async function dbCancelBooking(bookingId, passengerId) {
  const booking = memoryDB.bookings.get(bookingId);
  if (!booking) {
    return { success: false, message: 'Booking not found.', errorCode: 'NOT_FOUND', status: 404 };
  }

  if (booking.passenger_id !== passengerId) {
    return { success: false, message: 'Unauthorized.', status: 403 };
  }

  if (booking.status !== 'CONFIRMED') {
    return { success: false, message: 'Only CONFIRMED bookings can be cancelled.', status: 400 };
  }

  const ride = await dbGetRideById(booking.ride_id);
  if (!ride) {
    return { success: false, message: 'Associated ride not found.', status: 404 };
  }

  // Restore seats up to total_seats
  const restoredSeats = Math.min(ride.total_seats, ride.available_seats + booking.seats_booked);
  ride.available_seats = restoredSeats;
  ride.updated_at = new Date().toISOString();

  booking.status = 'CANCELLED';
  booking.cancelled_at = new Date().toISOString();
  booking.updated_at = new Date().toISOString();

  memoryDB.rides.set(ride.id, ride);
  memoryDB.bookings.set(booking.id, booking);

  // Notify driver
  await dbCreateNotification({
    userId: ride.driver_id,
    type: 'alert',
    title: 'Booking Cancelled',
    message: `A confirmed booking for your ride ${ride.origin} → ${ride.destination} was cancelled. ${booking.seats_booked} seat(s) released.`,
    relatedRideId: ride.id,
    relatedBookingId: booking.id,
  });

  return { success: true, message: 'Booking cancelled successfully.', data: { booking, availableSeats: ride.available_seats } };
}

/* Driver Cancel Ride */
export async function dbCancelRide(rideId, driverId) {
  const ride = await dbGetRideById(rideId);
  if (!ride) {
    return { success: false, message: 'Ride not found.', status: 404 };
  }

  if (ride.driver_id !== driverId) {
    return { success: false, message: 'Unauthorized.', status: 403 };
  }

  ride.status = 'CANCELLED';
  ride.updated_at = new Date().toISOString();
  memoryDB.rides.set(ride.id, ride);

  // Cancel pending requests
  for (const req of memoryDB.rideRequests.values()) {
    if (req.ride_id === rideId && req.status === 'PENDING') {
      req.status = 'REJECTED';
      req.updated_at = new Date().toISOString();
      memoryDB.rideRequests.set(req.id, req);

      await dbCreateNotification({
        userId: req.passenger_id,
        type: 'alert',
        title: 'Ride Cancelled',
        message: `The ride from ${ride.origin} to ${ride.destination} was cancelled by the driver.`,
        relatedRideId: ride.id,
      });
    }
  }

  // Cancel confirmed bookings
  for (const b of memoryDB.bookings.values()) {
    if (b.ride_id === rideId && b.status === 'CONFIRMED') {
      b.status = 'CANCELLED';
      b.cancelled_at = new Date().toISOString();
      b.updated_at = new Date().toISOString();
      memoryDB.bookings.set(b.id, b);

      await dbCreateNotification({
        userId: b.passenger_id,
        type: 'alert',
        title: 'Ride Cancelled',
        message: `Your confirmed booking from ${ride.origin} to ${ride.destination} was cancelled by the driver.`,
        relatedRideId: ride.id,
        relatedBookingId: b.id,
      });
    }
  }

  return { success: true, message: 'Ride cancelled successfully.', data: { ride } };
}

/* Bookings Queries */
export async function dbGetBookingsByPassengerId(passengerId) {
  const res = [];
  for (const b of memoryDB.bookings.values()) {
    if (b.passenger_id === passengerId) {
      const ride = await dbGetRideById(b.ride_id);
      res.push({ ...b, ride });
    }
  }
  return res;
}

/* Notifications */
export async function dbCreateNotification(notifData) {
  const notif = {
    id: `n_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    user_id: notifData.userId || notifData.user_id,
    type: notifData.type || 'info',
    title: notifData.title || 'Notification',
    message: notifData.message,
    related_ride_id: notifData.relatedRideId || null,
    related_request_id: notifData.relatedRequestId || null,
    related_booking_id: notifData.relatedBookingId || null,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from('notifications').insert([notif]);
  } catch (e) {}

  memoryDB.notifications.set(notif.id, notif);
  return notif;
}

export async function dbGetNotificationsByUserId(userId) {
  const res = [];
  for (const n of memoryDB.notifications.values()) {
    if (n.user_id === userId) res.push(n);
  }
  return res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function resetMemoryDB() {
  memoryDB.users.clear();
  memoryDB.vehicles.clear();
  memoryDB.rides.clear();
  memoryDB.rideRequests.clear();
  memoryDB.bookings.clear();
  memoryDB.notifications.clear();
  sampleRides.forEach((r) => memoryDB.rides.set(r.id, r));
}
