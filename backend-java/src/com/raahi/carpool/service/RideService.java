package com.raahi.carpool.service;

import com.raahi.carpool.model.Booking;
import com.raahi.carpool.model.Notification;
import com.raahi.carpool.model.Ride;
import com.raahi.carpool.model.RideRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

public class RideService {
    private final SupabaseClient supabase;
    private final Map<String, Ride> ridesMap = new ConcurrentHashMap<>();
    private final Map<String, RideRequest> requestsMap = new ConcurrentHashMap<>();
    private final Map<String, Booking> bookingsMap = new ConcurrentHashMap<>();
    private final Map<String, List<Notification>> notificationsMap = new ConcurrentHashMap<>();
    private final ReentrantLock lock = new ReentrantLock();

    public RideService(SupabaseClient supabase) {
        this.supabase = supabase;
        initSampleRides();
        syncFromSupabase();
    }

    private void initSampleRides() {
        Ride r1 = new Ride();
        r1.setId("r1");
        r1.setDriverId("u_aarav");
        r1.setDriverName("Aarav Mehta");
        r1.setDriverRating(4.8);
        r1.setDriverTrips(142);
        r1.setOrigin("Andheri West, Mumbai");
        r1.setDestination("Bandra Kurla Complex");
        r1.setOriginLatitude(19.1364);
        r1.setOriginLongitude(72.8296);
        r1.setDestinationLatitude(19.0596);
        r1.setDestinationLongitude(72.8656);
        r1.setDepartureDate("2026-10-15");
        r1.setDepartureTime("09:00");
        r1.setTotalSeats(3);
        r1.setAvailableSeats(3);
        r1.setPricePerSeat(80.0);
        r1.setVehicleModel("Hyundai Creta");
        r1.setVehicleColor("White");
        r1.setVehiclePlate("MH-02-AB-1234");
        r1.setStatus("PUBLISHED");
        ridesMap.put(r1.getId(), r1);

        Ride r2 = new Ride();
        r2.setId("r2");
        r2.setDriverId("u_priya");
        r2.setDriverName("Priya Sharma");
        r2.setDriverRating(4.9);
        r2.setDriverTrips(89);
        r2.setOrigin("Powai, Mumbai");
        r2.setDestination("Lower Parel");
        r2.setOriginLatitude(19.1176);
        r2.setOriginLongitude(72.9060);
        r2.setDestinationLatitude(18.9977);
        r2.setDestinationLongitude(72.8318);
        r2.setDepartureDate("2026-10-15");
        r2.setDepartureTime("08:30");
        r2.setTotalSeats(4);
        r2.setAvailableSeats(4);
        r2.setPricePerSeat(120.0);
        r2.setVehicleModel("Maruti Baleno");
        r2.setVehicleColor("Silver");
        r2.setVehiclePlate("MH-04-CD-5678");
        r2.setStatus("PUBLISHED");
        ridesMap.put(r2.getId(), r2);

        // Pre-seed sample pending request so the user can immediately test accepting a ride!
        RideRequest req1 = new RideRequest();
        req1.setId("req_sample_1");
        req1.setRideId(r1.getId());
        req1.setPassengerId("u_passenger_demo");
        req1.setPassengerName("Rahul Verma");
        req1.setPassengerRating(4.9);
        req1.setSeatsRequested(1);
        req1.setPickupLocation("DN Nagar Metro, Andheri");
        req1.setDropLocation("BKC Diamond Bourse");
        req1.setMessage("Office commute — please accept 1 seat!");
        req1.setStatus("PENDING");
        requestsMap.put(req1.getId(), req1);

        Notification n1 = new Notification();
        n1.setUserId("u_passenger_demo");
        n1.setType("match");
        n1.setTitle("New Ride Request 🚗");
        n1.setMessage("You have an incoming ride request from Rahul Verma for 1 seat on Andheri West → Bandra Kurla Complex.");
        n1.setRelatedRideId(r1.getId());
        n1.setRelatedRequestId(req1.getId());
        addNotification(n1);
    }

    /**
     * Initial sync of published rides from Supabase
     */
    public void syncFromSupabase() {
        try {
            List<Map<String, Object>> rows = supabase.query("rides", "select=*");
            for (Map<String, Object> row : rows) {
                Ride ride = Ride.fromMap(row);
                if (ride != null && ride.getId() != null) {
                    ridesMap.put(ride.getId(), ride);
                }
            }
            System.out.println("Synced " + rows.size() + " rides from Supabase.");
        } catch (Exception e) {
            System.err.println("Notice: Supabase initial sync fallback to local cache: " + e.getMessage());
        }
    }

    public static boolean isDeparturePassed(String dateStr, String timeStr) {
        if (dateStr == null || timeStr == null || dateStr.isBlank() || timeStr.isBlank()) return false;
        try {
            LocalDate d = LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            String[] parts = timeStr.split(":");
            int hour = Integer.parseInt(parts[0]);
            int min = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
            LocalDateTime departure = LocalDateTime.of(d, LocalTime.of(hour, min));
            return departure.isBefore(LocalDateTime.now());
        } catch (Exception e) {
            return false;
        }
    }

    /* -------------------------------------------------------------
       1. POST / OFFER A RIDE
       ------------------------------------------------------------- */
    public Map<String, Object> createRide(Ride ride) {
        if (ride.getOrigin() == null || ride.getOrigin().isBlank() ||
            ride.getDestination() == null || ride.getDestination().isBlank()) {
            return Map.of("success", false, "message", "Origin and Destination are required.", "errorCode", "VALIDATION_ERROR");
        }
        if (ride.getDepartureDate() == null || ride.getDepartureTime() == null) {
            return Map.of("success", false, "message", "Departure date and time are required.", "errorCode", "VALIDATION_ERROR");
        }
        if (ride.getTotalSeats() <= 0) {
            return Map.of("success", false, "message", "Total seats must be greater than 0.", "errorCode", "VALIDATION_ERROR");
        }

        if (ride.getAvailableSeats() <= 0) {
            ride.setAvailableSeats(ride.getTotalSeats());
        }
        if (ride.getStatus() == null || ride.getStatus().isBlank()) {
            ride.setStatus("PUBLISHED");
        }

        lock.lock();
        try {
            // Save to memory cache
            ridesMap.put(ride.getId(), ride);

            // Persist to Supabase Database
            Map<String, Object> inserted = supabase.insert("rides", ride.toSupabaseMap());
            if (inserted != null) {
                Ride refreshed = Ride.fromMap(inserted);
                if (refreshed != null) ridesMap.put(refreshed.getId(), refreshed);
            }

            return Map.of("success", true, "message", "Ride created successfully.", "ride", ride.toApiMap());
        } finally {
            lock.unlock();
        }
    }

    /* -------------------------------------------------------------
       2. GET / SEARCH RIDES
       ------------------------------------------------------------- */
    public List<Map<String, Object>> searchRides(String origin, String destination, String date, int passengerCount) {
        List<Map<String, Object>> results = new ArrayList<>();
        int reqSeats = Math.max(1, passengerCount);

        for (Ride ride : ridesMap.values()) {
            String status = ride.getStatus();
            boolean isActive = "PUBLISHED".equalsIgnoreCase(status) || "active".equalsIgnoreCase(status);
            if (!isActive) continue;
            if (ride.getAvailableSeats() < reqSeats) continue;
            if (isDeparturePassed(ride.getDepartureDate(), ride.getDepartureTime())) continue;

            if (date != null && !date.isBlank() && !date.equalsIgnoreCase(ride.getDepartureDate())) {
                continue;
            }

            if (origin != null && !origin.isBlank()) {
                if (!ride.getOrigin().toLowerCase().contains(origin.toLowerCase().trim())) {
                    continue;
                }
            }

            if (destination != null && !destination.isBlank()) {
                if (!ride.getDestination().toLowerCase().contains(destination.toLowerCase().trim())) {
                    continue;
                }
            }

            results.add(ride.toApiMap());
        }

        return results;
    }

    public Ride getRideById(String rideId) {
        return ridesMap.get(rideId);
    }

    /* -------------------------------------------------------------
       3. POST / BOOK / REQUEST A RIDE (Passenger)
       ------------------------------------------------------------- */
    public Map<String, Object> createRideRequest(RideRequest req) {
        if (req.getSeatsRequested() <= 0) {
            return Map.of("success", false, "message", "Invalid seats requested.", "errorCode", "INVALID_SEATS", "status", 400);
        }

        Ride ride = ridesMap.get(req.getRideId());
        if (ride == null) {
            return Map.of("success", false, "message", "Ride not found.", "errorCode", "RIDE_NOT_FOUND", "status", 404);
        }

        String status = ride.getStatus();
        boolean isActive = "PUBLISHED".equalsIgnoreCase(status) || "active".equalsIgnoreCase(status);
        if (!isActive) {
            return Map.of("success", false, "message", "Ride is not available for request.", "errorCode", "RIDE_NOT_PUBLISHED", "status", 400);
        }

        if (req.getPassengerId() != null && req.getPassengerId().equals(ride.getDriverId())) {
            return Map.of("success", false, "message", "Driver cannot request their own ride.", "errorCode", "CANNOT_REQUEST_OWN_RIDE", "status", 400);
        }

        if (isDeparturePassed(ride.getDepartureDate(), ride.getDepartureTime())) {
            return Map.of("success", false, "message", "Ride departure time has already passed.", "errorCode", "RIDE_EXPIRED", "status", 400);
        }

        if (req.getSeatsRequested() > ride.getAvailableSeats()) {
            return Map.of("success", false, "message", "Not enough seats available.", "errorCode", "INSUFFICIENT_SEATS", "status", 400);
        }

        // Check duplicate active request
        for (RideRequest existing : requestsMap.values()) {
            if (existing.getRideId().equals(req.getRideId()) &&
                existing.getPassengerId().equals(req.getPassengerId()) &&
                ("PENDING".equals(existing.getStatus()) || "ACCEPTED".equals(existing.getStatus()))) {
                return Map.of("success", false, "message", "You already have an active request for this ride.", "errorCode", "DUPLICATE_ACTIVE_REQUEST", "status", 409);
            }
        }

        lock.lock();
        try {
            req.setStatus("PENDING");
            requestsMap.put(req.getId(), req);

            // Create notification for driver
            Notification notif = new Notification();
            notif.setUserId(ride.getDriverId());
            notif.setType("match");
            notif.setTitle("New Ride Request 🚗");
            notif.setMessage("You have a new ride request from " + req.getPassengerName() + " for " + req.getSeatsRequested() + " seat(s).");
            notif.setRelatedRideId(ride.getId());
            notif.setRelatedRequestId(req.getId());
            addNotification(notif);

            return Map.of(
                    "success", true,
                    "message", "Ride request sent to driver (PENDING).",
                    "request", req.toMap(),
                    "status", 201
            );
        } finally {
            lock.unlock();
        }
    }

    /* -------------------------------------------------------------
       4. POST / ACCEPT RIDE REQUEST (Driver)
       ------------------------------------------------------------- */
    public Map<String, Object> acceptRideRequest(String requestId, String driverId) {
        lock.lock();
        try {
            RideRequest request = requestsMap.get(requestId);
            if (request == null) {
                return Map.of("success", false, "message", "Ride request not found.", "errorCode", "NOT_FOUND", "status", 404);
            }

            if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
                return Map.of("success", false, "message", "Request cannot be accepted because it is " + request.getStatus() + ".", "errorCode", "INVALID_STATUS", "status", 400);
            }

            Ride ride = ridesMap.get(request.getRideId());
            if (ride == null) {
                return Map.of("success", false, "message", "Associated ride not found.", "errorCode", "RIDE_NOT_FOUND", "status", 404);
            }

            // Authorization: driver must match
            if (driverId != null && !driverId.isBlank() && ride.getDriverId() != null && !ride.getDriverId().equals(driverId)) {
                return Map.of("success", false, "message", "Unauthorized: You are not the driver of this ride.", "errorCode", "FORBIDDEN", "status", 403);
            }

            if (isDeparturePassed(ride.getDepartureDate(), ride.getDepartureTime())) {
                request.setStatus("EXPIRED");
                return Map.of("success", false, "message", "Ride departure time has already passed.", "errorCode", "EXPIRED_RIDE", "status", 400);
            }

            // Atomic seat validation
            if (ride.getAvailableSeats() < request.getSeatsRequested()) {
                return Map.of("success", false, "message", "Not enough available seats to accept this request.", "errorCode", "INSUFFICIENT_SEATS", "status", 409);
            }

            // Deduct seats atomically
            int newSeats = ride.getAvailableSeats() - request.getSeatsRequested();
            ride.setAvailableSeats(newSeats);

            // Update request status
            request.setStatus("ACCEPTED");

            // Create confirmed booking
            Booking booking = new Booking();
            booking.setRideId(ride.getId());
            booking.setPassengerId(request.getPassengerId());
            booking.setRideRequestId(request.getId());
            booking.setSeatsBooked(request.getSeatsRequested());
            booking.setTotalAmount(request.getSeatsRequested() * ride.getPricePerSeat());
            booking.setStatus("CONFIRMED");
            bookingsMap.put(booking.getId(), booking);

            // Persist updated seats in Supabase
            supabase.update("rides", "id=eq." + ride.getId(), Map.of("seatsAvailable", newSeats));

            // Create notification for passenger
            Notification notif = new Notification();
            notif.setUserId(request.getPassengerId());
            notif.setType("booking");
            notif.setTitle("Ride Request Accepted! 🎉");
            notif.setMessage("Your ride request from " + ride.getOrigin() + " to " + ride.getDestination() + " has been accepted!");
            notif.setRelatedRideId(ride.getId());
            notif.setRelatedRequestId(request.getId());
            notif.setRelatedBookingId(booking.getId());
            addNotification(notif);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("request", request.toMap());
            data.put("booking", booking.toMap());
            data.put("remainingSeats", newSeats);

            return Map.of(
                    "success", true,
                    "message", "Ride request accepted and booking confirmed.",
                    "data", data
            );
        } finally {
            lock.unlock();
        }
    }

    /* -------------------------------------------------------------
       5. POST / REJECT RIDE REQUEST (Driver)
       ------------------------------------------------------------- */
    public Map<String, Object> rejectRideRequest(String requestId, String driverId) {
        lock.lock();
        try {
            RideRequest request = requestsMap.get(requestId);
            if (request == null) {
                return Map.of("success", false, "message", "Ride request not found.", "errorCode", "NOT_FOUND", "status", 404);
            }

            if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
                return Map.of("success", false, "message", "Cannot reject request with status " + request.getStatus() + ".", "status", 400);
            }

            Ride ride = ridesMap.get(request.getRideId());
            if (ride == null || (driverId != null && !driverId.equals(ride.getDriverId()))) {
                return Map.of("success", false, "message", "Unauthorized action.", "status", 403);
            }

            request.setStatus("REJECTED");

            // Notification for passenger
            Notification notif = new Notification();
            notif.setUserId(request.getPassengerId());
            notif.setType("alert");
            notif.setTitle("Ride Request Update");
            notif.setMessage("Your ride request from " + ride.getOrigin() + " to " + ride.getDestination() + " was rejected by the driver.");
            notif.setRelatedRideId(ride.getId());
            notif.setRelatedRequestId(request.getId());
            addNotification(notif);

            return Map.of("success", true, "message", "Ride request rejected.", "data", Map.of("request", request.toMap()));
        } finally {
            lock.unlock();
        }
    }

    /* -------------------------------------------------------------
       6. CANCEL PENDING REQUEST (Passenger)
       ------------------------------------------------------------- */
    public Map<String, Object> cancelPendingRequest(String requestId, String passengerId) {
        lock.lock();
        try {
            RideRequest request = requestsMap.get(requestId);
            if (request == null) {
                return Map.of("success", false, "message", "Request not found.", "status", 404);
            }
            if (passengerId != null && !passengerId.equals(request.getPassengerId())) {
                return Map.of("success", false, "message", "Unauthorized.", "status", 403);
            }
            if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
                return Map.of("success", false, "message", "Only PENDING requests can be cancelled via this action.", "status", 400);
            }

            request.setStatus("CANCELLED");

            Ride ride = ridesMap.get(request.getRideId());
            if (ride != null) {
                Notification notif = new Notification();
                notif.setUserId(ride.getDriverId());
                notif.setType("alert");
                notif.setTitle("Request Cancelled");
                notif.setMessage("A passenger cancelled their pending request for " + ride.getOrigin() + " → " + ride.getDestination() + ".");
                notif.setRelatedRideId(ride.getId());
                addNotification(notif);
            }

            return Map.of("success", true, "message", "Ride request cancelled.", "data", Map.of("request", request.toMap()));
        } finally {
            lock.unlock();
        }
    }

    /* -------------------------------------------------------------
       7. CANCEL CONFIRMED BOOKING (Passenger) - Restores seats
       ------------------------------------------------------------- */
    public Map<String, Object> cancelBooking(String bookingId, String passengerId) {
        lock.lock();
        try {
            Booking booking = bookingsMap.get(bookingId);
            if (booking == null) {
                return Map.of("success", false, "message", "Booking not found.", "status", 404);
            }
            if (passengerId != null && !passengerId.equals(booking.getPassengerId())) {
                return Map.of("success", false, "message", "Unauthorized.", "status", 403);
            }
            if (!"CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
                return Map.of("success", false, "message", "Only CONFIRMED bookings can be cancelled.", "status", 400);
            }

            Ride ride = ridesMap.get(booking.getRideId());
            if (ride == null) {
                return Map.of("success", false, "message", "Associated ride not found.", "status", 404);
            }

            // Restore seats up to total seats
            int restoredSeats = Math.min(ride.getTotalSeats(), ride.getAvailableSeats() + booking.getSeatsBooked());
            ride.setAvailableSeats(restoredSeats);

            booking.setStatus("CANCELLED");
            booking.setCancelledAt(java.time.Instant.now().toString());

            // Persist restored seats to Supabase
            supabase.update("rides", "id=eq." + ride.getId(), Map.of("seatsAvailable", restoredSeats));

            Notification notif = new Notification();
            notif.setUserId(ride.getDriverId());
            notif.setType("alert");
            notif.setTitle("Booking Cancelled");
            notif.setMessage("A booking for your ride " + ride.getOrigin() + " → " + ride.getDestination() + " was cancelled. " + booking.getSeatsBooked() + " seat(s) released.");
            notif.setRelatedRideId(ride.getId());
            notif.setRelatedBookingId(booking.getId());
            addNotification(notif);

            return Map.of("success", true, "message", "Booking cancelled successfully.", "data", Map.of("booking", booking.toMap(), "availableSeats", restoredSeats));
        } finally {
            lock.unlock();
        }
    }

    /* -------------------------------------------------------------
       8. CANCEL RIDE (Driver)
       ------------------------------------------------------------- */
    public Map<String, Object> cancelRide(String rideId, String driverId) {
        lock.lock();
        try {
            Ride ride = ridesMap.get(rideId);
            if (ride == null) {
                return Map.of("success", false, "message", "Ride not found.", "status", 404);
            }
            if (driverId != null && !driverId.equals(ride.getDriverId())) {
                return Map.of("success", false, "message", "Unauthorized.", "status", 403);
            }

            ride.setStatus("CANCELLED");
            supabase.update("rides", "id=eq." + ride.getId(), Map.of("status", "CANCELLED"));

            // Reject all pending requests
            for (RideRequest req : requestsMap.values()) {
                if (req.getRideId().equals(rideId) && "PENDING".equalsIgnoreCase(req.getStatus())) {
                    req.setStatus("REJECTED");
                    Notification notif = new Notification();
                    notif.setUserId(req.getPassengerId());
                    notif.setType("alert");
                    notif.setTitle("Ride Cancelled");
                    notif.setMessage("The ride from " + ride.getOrigin() + " to " + ride.getDestination() + " was cancelled by the driver.");
                    notif.setRelatedRideId(rideId);
                    addNotification(notif);
                }
            }

            // Cancel all bookings
            for (Booking b : bookingsMap.values()) {
                if (b.getRideId().equals(rideId) && "CONFIRMED".equalsIgnoreCase(b.getStatus())) {
                    b.setStatus("CANCELLED");
                    Notification notif = new Notification();
                    notif.setUserId(b.getPassengerId());
                    notif.setType("alert");
                    notif.setTitle("Ride Cancelled");
                    notif.setMessage("Your confirmed booking from " + ride.getOrigin() + " to " + ride.getDestination() + " was cancelled by the driver.");
                    notif.setRelatedRideId(rideId);
                    addNotification(notif);
                }
            }

            return Map.of("success", true, "message", "Ride cancelled successfully.", "data", Map.of("ride", ride.toApiMap()));
        } finally {
            lock.unlock();
        }
    }

    /* -------------------------------------------------------------
       QUERIES
       ------------------------------------------------------------- */
    public List<Map<String, Object>> getRequestsByRideId(String rideId) {
        List<Map<String, Object>> res = new ArrayList<>();
        for (RideRequest r : requestsMap.values()) {
            if (r.getRideId().equals(rideId)) {
                res.add(r.toMap());
            }
        }
        return res;
    }

    public List<Map<String, Object>> getRequestsByDriverId(String driverId) {
        List<Map<String, Object>> res = new ArrayList<>();
        for (RideRequest req : requestsMap.values()) {
            Ride ride = ridesMap.get(req.getRideId());
            if (ride != null && (driverId == null || driverId.equals(ride.getDriverId()))) {
                Map<String, Object> m = req.toMap();
                m.put("rideOrigin", ride.getOrigin());
                m.put("rideDestination", ride.getDestination());
                m.put("driverId", ride.getDriverId());
                res.add(m);
            }
        }
        return res;
    }

    public List<Map<String, Object>> getBookingsByPassengerId(String passengerId) {
        List<Map<String, Object>> res = new ArrayList<>();
        for (Booking b : bookingsMap.values()) {
            if (passengerId == null || passengerId.equals(b.getPassengerId())) {
                Map<String, Object> m = b.toMap();
                Ride ride = ridesMap.get(b.getRideId());
                if (ride != null) m.put("ride", ride.toApiMap());
                res.add(m);
            }
        }
        return res;
    }

    private void addNotification(Notification n) {
        notificationsMap.computeIfAbsent(n.getUserId(), k -> new ArrayList<>()).add(0, n);
    }

    public List<Map<String, Object>> getNotificationsByUserId(String userId) {
        List<Notification> list = notificationsMap.getOrDefault(userId, Collections.emptyList());
        List<Map<String, Object>> res = new ArrayList<>();
        for (Notification n : list) {
            res.add(n.toMap());
        }
        return res;
    }

    public void clearAll() {
        ridesMap.clear();
        requestsMap.clear();
        bookingsMap.clear();
        notificationsMap.clear();
    }
}
