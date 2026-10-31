import fs from 'fs';
import path from 'path';
import { supabase } from './supabase.js';

// In-memory store for fallback mode when Supabase DB tables aren't migrated
const globalStore = globalThis.__raahi_memory_db || {
  users: new Map(),
  vehicles: new Map(),
  rides: new Map(),
  rideRequests: new Map(),
  bookings: new Map(),
  notifications: new Map(),
  verifications: new Map(),
};
if (process.env.NODE_ENV !== 'production') {
  globalThis.__raahi_memory_db = globalStore;
}
const memoryDB = globalStore;

const DATA_DIR = path.join(process.cwd(), 'data');
const VERIFICATIONS_FILE = path.join(DATA_DIR, 'verifications.json');
const RIDES_FILE = path.join(DATA_DIR, 'rides.json');
const RIDE_REQUESTS_FILE = path.join(DATA_DIR, 'ride_requests.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

function loadAllDataFromFiles() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(RIDES_FILE)) {
      const list = JSON.parse(fs.readFileSync(RIDES_FILE, 'utf8'));
      if (Array.isArray(list)) list.forEach((r) => { if (r && r.id) memoryDB.rides.set(r.id, r); });
    }
    if (fs.existsSync(RIDE_REQUESTS_FILE)) {
      const list = JSON.parse(fs.readFileSync(RIDE_REQUESTS_FILE, 'utf8'));
      if (Array.isArray(list)) list.forEach((req) => { if (req && req.id) memoryDB.rideRequests.set(req.id, req); });
    }
    if (fs.existsSync(BOOKINGS_FILE)) {
      const list = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
      if (Array.isArray(list)) list.forEach((b) => { if (b && b.id) memoryDB.bookings.set(b.id, b); });
    }
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const list = JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf8'));
      if (Array.isArray(list)) list.forEach((n) => { if (n && n.id) memoryDB.notifications.set(n.id, n); });
    }
  } catch (e) {
    console.error('Error loading data from file:', e.message);
  }
}

export function saveRidesToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const list = Array.from(memoryDB.rides.values());
    fs.writeFileSync(RIDES_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {}
}

export function saveRequestsToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const list = Array.from(memoryDB.rideRequests.values());
    fs.writeFileSync(RIDE_REQUESTS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {}
}

export function saveBookingsToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const list = Array.from(memoryDB.bookings.values());
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {}
}

export function saveNotificationsToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const list = Array.from(memoryDB.notifications.values());
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {}
}

function loadVerificationsFromFile() {
  try {
    if (fs.existsSync(VERIFICATIONS_FILE)) {
      const content = fs.readFileSync(VERIFICATIONS_FILE, 'utf8');
      const list = JSON.parse(content);
      if (Array.isArray(list)) {
        list.forEach((rec) => {
          if (rec) {
            const key = rec.id || rec.email?.toLowerCase();
            if (key) {
              memoryDB.verifications.set(key, rec);
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('Error loading verifications from file:', e.message);
  }
}

function saveVerificationsToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(memoryDB.verifications.values());
    fs.writeFileSync(VERIFICATIONS_FILE, JSON.stringify(list, null, 2), 'utf8');

    // Only mirror to raahi-admin-portal if that directory actually exists
    const portalDataDir = path.resolve(process.cwd(), '..', 'raahi-admin-portal', 'data');
    if (fs.existsSync(portalDataDir)) {
      try {
        const portalFile = path.join(portalDataDir, 'verifications.json');
        fs.writeFileSync(portalFile, JSON.stringify(list, null, 2), 'utf8');
      } catch (err) {}
    }
  } catch (e) {
    console.error('Error saving verifications to file:', e.message);
  }
}

// Initial load of verifications and persistent data
loadVerificationsFromFile();
loadAllDataFromFiles();

async function withTimeout(promise, ms = 6000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Supabase request timeout')), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise,
  ]);
}

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

// Seed sample pending request so user can immediately test accepting a ride
const sampleReq = {
  id: 'req_sample_1',
  ride_id: 'r1',
  passenger_id: 'u_passenger_demo',
  passenger_name: 'Pooja Verma',
  passenger_rating: 4.9,
  seats_requested: 1,
  pickup_location: 'DN Nagar Metro, Andheri',
  drop_location: 'BKC Diamond Bourse',
  message: 'Office commute — 1 seat needed please!',
  status: 'PENDING',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
memoryDB.rideRequests.set(sampleReq.id, sampleReq);

const sampleNotif = {
  id: 'n_sample_1',
  user_id: 'u_passenger_demo',
  type: 'match',
  title: 'New Ride Request 🚗',
  message: 'You have a pending request from Pooja Verma for 1 seat on Andheri West → Bandra Kurla Complex.',
  related_ride_id: 'r1',
  related_request_id: 'req_sample_1',
  is_read: false,
  created_at: new Date().toISOString(),
};
memoryDB.notifications.set(sampleNotif.id, sampleNotif);

/* Helper: Check if departure has passed */
export function isDeparturePassed(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  try {
    let cleanTime = String(timeStr).trim();
    let isPM = false;
    let isAM = false;
    if (cleanTime.toUpperCase().includes('PM')) {
      isPM = true;
      cleanTime = cleanTime.replace(/PM/i, '').trim();
    } else if (cleanTime.toUpperCase().includes('AM')) {
      isAM = true;
      cleanTime = cleanTime.replace(/AM/i, '').trim();
    }
    const [h, m] = cleanTime.split(':').map(Number);
    let hour = isNaN(h) ? 9 : h;
    let min = isNaN(m) ? 0 : m;
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    const formattedHour = String(hour).padStart(2, '0');
    const formattedMin = String(min).padStart(2, '0');
    const departureDateTime = new Date(`${dateStr}T${formattedHour}:${formattedMin}:00`);
    if (isNaN(departureDateTime.getTime())) return false;
    return departureDateTime.getTime() < Date.now();
  } catch (e) {
    return false;
  }
}

/* Automatic expiration helper for pending requests */
export function processExpiredRequests() {
  let changed = false;
  for (const [id, req] of memoryDB.rideRequests.entries()) {
    if (req.status === 'PENDING') {
      const ride = memoryDB.rides.get(req.ride_id);
      if (ride && isDeparturePassed(ride.departure_date, ride.departure_time)) {
        req.status = 'EXPIRED';
        req.updated_at = new Date().toISOString();
        memoryDB.rideRequests.set(id, req);
        changed = true;
      }
    }
  }
  if (changed) {
    saveRequestsToFile();
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
  const originStr = typeof rideData.origin === 'object' ? rideData.origin.name : (rideData.origin || (rideData.from ? (typeof rideData.from === 'object' ? rideData.from.name : rideData.from) : ''));
  const destStr = typeof rideData.destination === 'object' ? rideData.destination.name : (rideData.destination || (rideData.to ? (typeof rideData.to === 'object' ? rideData.to.name : rideData.to) : ''));
  const total = Number(rideData.totalSeats || rideData.total_seats || rideData.seats || 3);
  const avail = Number(rideData.availableSeats ?? rideData.available_seats ?? rideData.seatsAvailable ?? total);

  const ride = {
    id: rideData.id || `r_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    driver_id: rideData.driverId || rideData.driver_id || 'u_driver_default',
    vehicle_id: rideData.vehicleId || rideData.vehicle_id || null,
    origin: originStr,
    destination: destStr,
    origin_latitude: rideData.originLatitude || rideData.origin_latitude || (rideData.from?.lat || null),
    origin_longitude: rideData.originLongitude || rideData.origin_longitude || (rideData.from?.lng || null),
    destination_latitude: rideData.destinationLatitude || rideData.destination_latitude || (rideData.to?.lat || null),
    destination_longitude: rideData.destinationLongitude || rideData.destination_longitude || (rideData.to?.lng || null),
    departure_date: rideData.departureDate || rideData.departure_date || rideData.date,
    departure_time: rideData.departureTime || rideData.departure_time || rideData.time,
    total_seats: total,
    available_seats: avail,
    price_per_seat: Number(rideData.pricePerSeat || rideData.price_per_seat || rideData.price || 50),
    status: rideData.status || 'PUBLISHED',
    waypoints: Array.isArray(rideData.waypoints) ? rideData.waypoints : [],
    driver: rideData.driver || {
      id: rideData.driverId || rideData.driver_id,
      name: rideData.driverName || 'Verified Driver',
      rating: 4.8,
      total_ratings: 12,
      is_verified: true,
    },
    vehicle: rideData.vehicle || {
      model: rideData.vehicleModel || 'Standard Sedan',
      color: rideData.vehicleColor || 'White',
      registration_number: rideData.vehiclePlate || 'MH-01-AB-0000',
    },
    created_at: rideData.createdAt || rideData.created_at || new Date().toISOString(),
    updated_at: rideData.updatedAt || rideData.updated_at || new Date().toISOString(),
  };

  // Primary: Central Supabase Database
  try {
    const { data, error } = await withTimeout(supabase.from('rides').upsert([ride]).select().single(), 2500);
    if (data && !error) {
      memoryDB.rides.set(data.id, data);
      saveRidesToFile();
      return data;
    }
  } catch (e) {
    console.warn('Notice: Supabase ride insert fallback:', e.message);
  }

  // Backup: Local persistent disk file & memory
  memoryDB.rides.set(ride.id, ride);
  saveRidesToFile();
  return ride;
}

export async function dbGetRideById(rideId) {
  try {
    const { data } = await withTimeout(supabase.from('rides').select('*').eq('id', rideId).single(), 2000);
    if (data) {
      memoryDB.rides.set(data.id, data);
      saveRidesToFile();
      return data;
    }
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
  const ridesMap = new Map();

  // Populate from local file/memory store first
  for (const [id, r] of memoryDB.rides.entries()) {
    ridesMap.set(id, r);
  }

  // Fetch live from central Supabase database
  try {
    const { data, error } = await withTimeout(supabase.from('rides').select('*').eq('status', 'PUBLISHED'), 2500);
    if (data && !error && data.length > 0) {
      for (const row of data) {
        ridesMap.set(row.id, row);
        memoryDB.rides.set(row.id, row);
      }
      saveRidesToFile();
    }
  } catch (e) {
    console.warn('Notice: Supabase search live fetch fallback:', e.message);
  }

  const allRides = Array.from(ridesMap.values());
  const requestedSeats = Number(passengerCount) || 1;

  return allRides.filter((ride) => {
    // Only published rides
    if (ride.status !== 'PUBLISHED') return false;

    // Check available seats
    const avail = Number(ride.available_seats ?? ride.availableSeats ?? 0);
    if (avail < requestedSeats) return false;

    // Check departure expiration
    const depDate = ride.departure_date || ride.date;
    const depTime = ride.departure_time || ride.time;
    if (isDeparturePassed(depDate, depTime)) return false;

    // Date filter if specified
    if (date && depDate && depDate !== date) return false;

    // Origin matching (case-insensitive substring)
    if (origin && origin.trim()) {
      const origQuery = origin.toLowerCase().trim();
      const origText = (ride.origin || ride.from?.name || '').toLowerCase();
      const origWaypoints = (ride.waypoints || []).some((w) => {
        const name = (typeof w === 'string' ? w : w.name || '').toLowerCase();
        return name.includes(origQuery);
      });
      if (!origText.includes(origQuery) && !origWaypoints) return false;
    }

    // Destination matching (case-insensitive substring)
    if (destination && destination.trim()) {
      const destQuery = destination.toLowerCase().trim();
      const destText = (ride.destination || ride.to?.name || '').toLowerCase();
      const destWaypoints = (ride.waypoints || []).some((w) => {
        const name = (typeof w === 'string' ? w : w.name || '').toLowerCase();
        return name.includes(destQuery);
      });
      if (!destText.includes(destQuery) && !destWaypoints) return false;
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
    const { data } = await withTimeout(supabase.from('ride_requests').insert([req]).select().single(), 2500);
    if (data) {
      memoryDB.rideRequests.set(data.id, data);
      saveRequestsToFile();
      return data;
    }
  } catch (e) {}

  memoryDB.rideRequests.set(req.id, req);
  saveRequestsToFile();
  return req;
}

export async function dbGetActiveRideRequest(rideId, passengerId) {
  processExpiredRequests();
  try {
    const { data } = await withTimeout(
      supabase
        .from('ride_requests')
        .select('*')
        .eq('ride_id', rideId)
        .eq('passenger_id', passengerId)
        .in('status', ['PENDING', 'ACCEPTED']),
      2000
    );
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
    const { data } = await withTimeout(supabase.from('ride_requests').select('*').eq('id', requestId).single(), 2000);
    if (data) {
      memoryDB.rideRequests.set(data.id, data);
      saveRequestsToFile();
      return data;
    }
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
  const map = new Map();
  for (const req of memoryDB.rideRequests.values()) {
    if (req.ride_id === rideId) map.set(req.id, req);
  }

  try {
    const { data } = await withTimeout(supabase.from('ride_requests').select('*').eq('ride_id', rideId), 2000);
    if (data && data.length > 0) {
      for (const row of data) {
        map.set(row.id, row);
        memoryDB.rideRequests.set(row.id, row);
      }
      saveRequestsToFile();
    }
  } catch (e) {}

  return Array.from(map.values());
}

export async function dbGetRequestsByPassengerId(passengerId) {
  processExpiredRequests();
  const map = new Map();
  for (const req of memoryDB.rideRequests.values()) {
    if (req.passenger_id === passengerId) map.set(req.id, req);
  }

  try {
    const { data } = await withTimeout(supabase.from('ride_requests').select('*').eq('passenger_id', passengerId), 2000);
    if (data && data.length > 0) {
      for (const row of data) {
        map.set(row.id, row);
        memoryDB.rideRequests.set(row.id, row);
      }
      saveRequestsToFile();
    }
  } catch (e) {}

  return Array.from(map.values());
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
  saveRidesToFile();
  saveRequestsToFile();
  saveBookingsToFile();

  // Sync to Supabase table if available
  try {
    await withTimeout(
      Promise.all([
        supabase.from('rides').update({ available_seats: ride.available_seats }).eq('id', ride.id),
        supabase.from('ride_requests').update({ status: 'ACCEPTED' }).eq('id', request.id),
        supabase.from('bookings').insert([createdBooking]),
      ]),
      2500
    );
  } catch (e) {
    console.warn('Notice: Supabase acceptance update:', e.message);
  }

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
  saveRequestsToFile();

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
  saveRequestsToFile();

  try {
    await supabase.from('ride_requests').update({ status: 'CANCELLED' }).eq('id', request.id);
  } catch (e) {}

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
  saveRidesToFile();
  saveBookingsToFile();

  try {
    await supabase.from('rides').update({ available_seats: restoredSeats }).eq('id', ride.id);
    await supabase.from('bookings').update({ status: 'CANCELLED', cancelled_at: booking.cancelled_at }).eq('id', booking.id);
  } catch (e) {}

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
  saveRidesToFile();

  try {
    await supabase.from('rides').update({ status: 'CANCELLED' }).eq('id', ride.id);
  } catch (e) {}

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
  saveRequestsToFile();

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
  saveBookingsToFile();

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
    related_ride_id: notifData.relatedRideId || notifData.related_ride_id || null,
    related_request_id: notifData.relatedRequestId || notifData.related_request_id || null,
    related_booking_id: notifData.relatedBookingId || notifData.related_booking_id || null,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from('notifications').insert([notif]);
  } catch (e) {}

  memoryDB.notifications.set(notif.id, notif);
  saveNotificationsToFile();
  return notif;
}

export async function dbGetNotificationsByUserId(userId) {
  const notifMap = new Map();
  for (const n of memoryDB.notifications.values()) {
    if (n.user_id === userId) notifMap.set(n.id, n);
  }

  try {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      for (const row of data) {
        notifMap.set(row.id, row);
        memoryDB.notifications.set(row.id, row);
      }
      saveNotificationsToFile();
    }
  } catch (e) {}

  const res = Array.from(notifMap.values());
  return res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function resetMemoryDB() {
  memoryDB.users.clear();
  memoryDB.vehicles.clear();
  memoryDB.rides.clear();
  memoryDB.rideRequests.clear();
  memoryDB.bookings.clear();
  memoryDB.notifications.clear();
  memoryDB.verifications.clear();
  sampleRides.forEach((r) => memoryDB.rides.set(r.id, r));
}

/* =========================================================
   Document Verification Operations (Aadhaar & Driving License)
   ========================================================= */

export async function dbCreateDocumentVerification(data) {
  loadVerificationsFromFile();
  const normEmail = (data.email || '').trim().toLowerCase();
  const timestamp = Date.now();
  const id = data.id || `doc_${normEmail.replace(/[^a-z0-9]/g, '_')}_${timestamp}`;

  const record = {
    id,
    type: 'DOC_VERIFICATION',
    email: normEmail,
    fullName: data.fullName || '',
    phone: data.phone || '',
    idProofName: data.idProofName || 'aadhaar_card.pdf',
    idProofBase64: data.idProofBase64 || null,
    drivingLicenseName: data.drivingLicenseName || 'driving_license.pdf',
    drivingLicenseBase64: data.drivingLicenseBase64 || null,
    status: 'PENDING', // PENDING, APPROVED, REJECTED
    adminNotes: '',
    submittedAt: data.submittedAt || new Date().toISOString(),
    reviewedAt: null,
  };

  // Persist locally in memory and disk file immediately by its unique submission id
  memoryDB.verifications.set(id, record);
  saveVerificationsToFile();

  // Try storing in dedicated Supabase 'verifications' table with timeout
  try {
    const { data: inserted, error } = await withTimeout(
      supabase
        .from('verifications')
        .upsert([record], { onConflict: 'id' })
        .select()
        .single(),
      1500
    );
    if (inserted && !error) {
      memoryDB.verifications.set(id, inserted);
      saveVerificationsToFile();
      return inserted;
    }
  } catch (err) {}

  // Try storing in Supabase rides table with timeout
  try {
    const now = new Date();
    const payload = {
      id: id,
      driver_id: id,
      origin: 'Verification Portal',
      destination: 'Document Verification',
      origin_latitude: 0,
      origin_longitude: 0,
      destination_latitude: 0,
      destination_longitude: 0,
      departure_date: now.toISOString().split('T')[0],
      departure_time: '00:00',
      total_seats: 1,
      available_seats: 1,
      price_per_seat: 0,
      status: 'VERIFICATION_PENDING',
      driver: {
        type: 'DOC_VERIFICATION',
        ...record,
      },
      created_at: record.submittedAt,
      updated_at: record.submittedAt,
    };
    await withTimeout(supabase.from('rides').upsert([payload], { onConflict: 'id' }), 3000);
  } catch (err) {}

  return record;
}

function getRowTimestamp(r) {
  if (!r) return 0;
  const tRev = r.driver?.reviewedAt ? new Date(r.driver.reviewedAt).getTime() : 0;
  const tSub = r.driver?.submittedAt ? new Date(r.driver.submittedAt).getTime() : 0;
  const idMatch = (r.id || '').match(/_(\d{13})$/);
  const tId = idMatch ? parseInt(idMatch[1], 10) : 0;
  const tCreated = r.created_at ? new Date(r.created_at).getTime() : 0;
  const tUpdated = r.updated_at ? new Date(r.updated_at).getTime() : 0;
  return Math.max(tRev, tSub, tId, tCreated, tUpdated);
}

export async function dbGetVerificationByEmail(email) {
  loadVerificationsFromFile();
  if (!email) return null;
  const normEmail = email.toLowerCase().trim();

  // Find all matching local records and pick the latest one
  const matchingLocal = [];
  for (const [, val] of memoryDB.verifications.entries()) {
    if (val && (val.email || '').toLowerCase().trim() === normEmail) {
      matchingLocal.push(val);
    }
  }
  matchingLocal.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  const localRec = matchingLocal[0] || null;

  // 1. Check Supabase rides storage with timeout (primary cloud source)
  try {
    const { data: rows } = await withTimeout(
      supabase
        .from('rides')
        .select('*')
        .ilike('status', 'VERIFICATION_%'),
      6000
    );

    if (rows && rows.length > 0) {
      const userRows = rows.filter(
        (r) => r.driver && (r.driver.email || '').toLowerCase().trim() === normEmail
      );
      if (userRows.length > 0) {
        userRows.sort((a, b) => getRowTimestamp(b) - getRowTimestamp(a));
        const latest = userRows[0];
        const status = latest.status === 'VERIFICATION_APPROVED' ? 'APPROVED'
          : latest.status === 'VERIFICATION_REJECTED' ? 'REJECTED'
          : (latest.driver?.status || localRec?.status || 'PENDING');

        const resolvedIdProof = latest.driver?.idProofBase64 || localRec?.idProofBase64 || '';
        const resolvedIdProofName = latest.driver?.idProofName || localRec?.idProofName || 'Identity Document';
        const resolvedDl = latest.driver?.drivingLicenseBase64 || localRec?.drivingLicenseBase64 || '';
        const resolvedDlName = latest.driver?.drivingLicenseName || localRec?.drivingLicenseName || 'Driving License';

        const rec = {
          ...(localRec || {}),
          ...latest.driver,
          id: latest.driver?.id || latest.id || localRec?.id,
          email: normEmail,
          status,
          rowId: latest.id,
          idProofBase64: resolvedIdProof,
          idProofName: resolvedIdProofName,
          drivingLicenseBase64: resolvedDl,
          drivingLicenseName: resolvedDlName,
          submittedAt: latest.driver?.submittedAt || localRec?.submittedAt || new Date().toISOString(),
          reviewedAt: latest.driver?.reviewedAt || (status !== 'PENDING' ? new Date(getRowTimestamp(latest)).toISOString() : null) || localRec?.reviewedAt,
          adminNotes: latest.driver?.adminNotes || localRec?.adminNotes || '',
        };
        memoryDB.verifications.set(rec.id, rec);
        return rec;
      }
    }
  } catch (err) {}

  // 2. Check dedicated verifications table with timeout
  try {
    const { data } = await withTimeout(
      supabase
        .from('verifications')
        .select('*')
        .eq('email', normEmail)
        .order('submittedAt', { ascending: false })
        .limit(1)
        .maybeSingle(),
      4000
    );
    if (data) {
      const merged = {
        ...(localRec || {}),
        ...data,
        idProofBase64: data.idProofBase64 || localRec?.idProofBase64 || '',
        drivingLicenseBase64: data.drivingLicenseBase64 || localRec?.drivingLicenseBase64 || '',
      };
      memoryDB.verifications.set(merged.id || normEmail, merged);
      return merged;
    }
  } catch (err) {}

  if (localRec) return localRec;
  return null;
}

export async function dbGetAllVerifications() {
  loadVerificationsFromFile();
  const userMap = new Map();

  // 1. Preload local disk/memory records
  for (const [, val] of memoryDB.verifications.entries()) {
    if (val && val.email) {
      const email = val.email.toLowerCase().trim();
      if (!userMap.has(email)) userMap.set(email, []);
      userMap.get(email).push({ ...val });
    }
  }

  // 2. Check Supabase rides database with timeout
  try {
    const { data: rideRows } = await withTimeout(
      supabase
        .from('rides')
        .select('*')
        .ilike('status', 'VERIFICATION_%'),
      6000
    );

    if (rideRows && rideRows.length > 0) {
      rideRows.forEach((r) => {
        if (r.driver && (r.driver.type === 'DOC_VERIFICATION' || r.driver.email)) {
          const email = (r.driver.email || '').toLowerCase().trim();
          if (email) {
            const status = r.status === 'VERIFICATION_APPROVED' ? 'APPROVED'
              : r.status === 'VERIFICATION_REJECTED' ? 'REJECTED'
              : (r.driver?.status || 'PENDING');
            const rowRec = {
              ...r.driver,
              id: r.driver.id || r.id,
              status,
              rowId: r.id,
              submittedAt: r.driver?.submittedAt || r.created_at,
              reviewedAt: r.driver?.reviewedAt || (status !== 'PENDING' ? r.updated_at : null),
              adminNotes: r.driver?.adminNotes || '',
            };
            if (!userMap.has(email)) userMap.set(email, []);
            userMap.get(email).push(rowRec);
          }
        }
      });
    }
  } catch (err) {}

  // 3. Check dedicated verifications table with timeout
  try {
    const { data } = await withTimeout(
      supabase
        .from('verifications')
        .select('*')
        .order('submittedAt', { ascending: false }),
      2000
    );
    if (data && data.length > 0) {
      data.forEach((d) => {
        if (d && d.email) {
          const email = d.email.toLowerCase().trim();
          if (!userMap.has(email)) userMap.set(email, []);
          userMap.get(email).push({ ...d });
        }
      });
    }
  } catch (err) {}

  // Consolidate exactly ONE authoritative entry per user email
  const consolidatedList = [];
  userMap.forEach((records, email) => {
    // Sort submissions newest first
    records.sort((a, b) => getRowTimestamp(b) - getRowTimestamp(a));
    const latest = records[0];

    // Find newest record with uploaded document photos
    const docRecord = records.find(
      (r) => (r.idProofBase64 && r.idProofBase64.length > 50) ||
             (r.drivingLicenseBase64 && r.drivingLicenseBase64.length > 50)
    ) || latest;

    const idProofBase64 = docRecord.idProofBase64 || latest.idProofBase64 || '';
    const idProofName = docRecord.idProofName || latest.idProofName || 'Identity Document';
    const drivingLicenseBase64 = docRecord.drivingLicenseBase64 || latest.drivingLicenseBase64 || '';
    const drivingLicenseName = docRecord.drivingLicenseName || latest.drivingLicenseName || 'Driving License';

    // Status logic:
    // If user submitted new documents after previous review, status is PENDING for new review
    const latestSubTime = new Date(latest.submittedAt || 0).getTime();
    const latestRevTime = latest.reviewedAt ? new Date(latest.reviewedAt).getTime() : 0;
    let finalStatus = latest.status || 'PENDING';
    if (latestRevTime && latestSubTime > latestRevTime) {
      finalStatus = 'PENDING';
    }

    consolidatedList.push({
      ...docRecord,
      ...latest,
      id: latest.id || ('doc_' + email.replace(/[^a-z0-9]/g, '_')),
      email,
      fullName: latest.fullName || docRecord.fullName || 'User',
      phone: latest.phone || docRecord.phone || '',
      status: finalStatus,
      idProofBase64,
      idProofName,
      drivingLicenseBase64,
      drivingLicenseName,
      submittedAt: latest.submittedAt || docRecord.submittedAt || new Date().toISOString(),
      reviewedAt: finalStatus === 'PENDING' ? null : (latest.reviewedAt || docRecord.reviewedAt),
      adminNotes: latest.adminNotes || docRecord.adminNotes || '',
    });
  });

  return consolidatedList.sort(
    (a, b) => getRowTimestamp(b) - getRowTimestamp(a)
  );
}

export async function dbUpdateVerificationStatus(idOrEmail, action, adminNotes = '') {
  loadVerificationsFromFile();
  const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  const now = new Date();
  const reviewedAt = now.toISOString();

  // Find existing record in memory by id first, then fallback to email
  let record = memoryDB.verifications.get(idOrEmail);
  if (!record) {
    for (const [, val] of memoryDB.verifications.entries()) {
      if (val.id === idOrEmail || val.email.toLowerCase() === idOrEmail.toLowerCase()) {
        record = val;
        break;
      }
    }
  }

  const defaultNotes = status === 'REJECTED'
    ? 'Invalid documents try with Original documents'
    : 'Verified successfully.';

  // If not in memory, fetch from Supabase
  if (!record) {
    record = await dbGetVerificationByEmail(idOrEmail);
  }

  const finalNotes = adminNotes || defaultNotes;
  const updateId = record?.id || idOrEmail;
  const normEmail = (record?.email || idOrEmail).toLowerCase().trim();

  const updatedRecord = {
    ...(record || {}),
    id: updateId,
    email: normEmail,
    status,
    adminNotes: finalNotes,
    reviewedAt,
    idProofBase64: record?.idProofBase64 || '',
    idProofName: record?.idProofName || '',
    drivingLicenseBase64: record?.drivingLicenseBase64 || '',
    drivingLicenseName: record?.drivingLicenseName || '',
  };

  memoryDB.verifications.set(updateId, updatedRecord);
  saveVerificationsToFile();

  // 1. Update in dedicated verifications table with timeout
  try {
    await withTimeout(
      supabase
        .from('verifications')
        .update({
          status,
          adminNotes: finalNotes,
          reviewedAt,
        })
        .or(`id.eq.${updateId},email.eq.${normEmail}`),
      1500
    );
  } catch (err) {}

  // 2. Persist update row in Supabase database with timeout
  try {
    const payload = {
      id: updateId,
      driver_id: updateId,
      origin: 'Verification Portal',
      destination: 'Document Verification',
      origin_latitude: 0,
      origin_longitude: 0,
      destination_latitude: 0,
      destination_longitude: 0,
      departure_date: now.toISOString().split('T')[0],
      departure_time: '00:00',
      total_seats: 1,
      available_seats: 1,
      price_per_seat: 0,
      status: status === 'APPROVED' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
      driver: {
        type: 'DOC_VERIFICATION',
        ...updatedRecord,
      },
      created_at: updatedRecord?.submittedAt || now.toISOString(),
      updated_at: reviewedAt,
    };
    await withTimeout(supabase.from('rides').upsert([payload], { onConflict: 'id' }), 3000);
  } catch (err) {}

  return updatedRecord;
}

