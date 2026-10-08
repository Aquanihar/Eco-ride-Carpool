package com.raahi.carpool.model;

import java.time.Instant;
import java.util.*;

public class Booking {
    private String id;
    private String rideId;
    private String passengerId;
    private String rideRequestId;
    private int seatsBooked;
    private double totalAmount;
    private String status; // CONFIRMED, CANCELLED
    private String confirmedAt;
    private String cancelledAt;
    private String createdAt;
    private String updatedAt;

    public Booking() {
        this.id = "b_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 5);
        this.status = "CONFIRMED";
        this.seatsBooked = 1;
        this.confirmedAt = Instant.now().toString();
        this.createdAt = this.confirmedAt;
        this.updatedAt = this.confirmedAt;
    }

    public static Booking fromMap(Map<String, Object> map) {
        if (map == null) return null;
        Booking b = new Booking();
        if (map.containsKey("id")) b.setId(String.valueOf(map.get("id")));

        if (map.containsKey("rideId")) b.setRideId(String.valueOf(map.get("rideId")));
        else if (map.containsKey("ride_id")) b.setRideId(String.valueOf(map.get("ride_id")));

        if (map.containsKey("passengerId")) b.setPassengerId(String.valueOf(map.get("passengerId")));
        else if (map.containsKey("passenger_id")) b.setPassengerId(String.valueOf(map.get("passenger_id")));

        if (map.containsKey("rideRequestId")) b.setRideRequestId(String.valueOf(map.get("rideRequestId")));
        else if (map.containsKey("ride_request_id")) b.setRideRequestId(String.valueOf(map.get("ride_request_id")));

        if (map.containsKey("seatsBooked")) b.setSeatsBooked(asInt(map.get("seatsBooked"), 1));
        else if (map.containsKey("seats_booked")) b.setSeatsBooked(asInt(map.get("seats_booked"), 1));

        if (map.containsKey("totalAmount")) b.setTotalAmount(asDouble(map.get("totalAmount"), 0.0));
        else if (map.containsKey("total_amount")) b.setTotalAmount(asDouble(map.get("total_amount"), 0.0));

        if (map.containsKey("status")) b.setStatus(String.valueOf(map.get("status")));
        if (map.containsKey("confirmedAt")) b.setConfirmedAt(String.valueOf(map.get("confirmedAt")));
        if (map.containsKey("cancelledAt")) b.setCancelledAt(String.valueOf(map.get("cancelledAt")));
        if (map.containsKey("createdAt")) b.setCreatedAt(String.valueOf(map.get("createdAt")));
        if (map.containsKey("updatedAt")) b.setUpdatedAt(String.valueOf(map.get("updatedAt")));

        return b;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("rideId", rideId);
        m.put("ride_id", rideId);
        m.put("passengerId", passengerId);
        m.put("passenger_id", passengerId);
        m.put("rideRequestId", rideRequestId);
        m.put("ride_request_id", rideRequestId);
        m.put("seatsBooked", seatsBooked);
        m.put("seats_booked", seatsBooked);
        m.put("totalAmount", totalAmount);
        m.put("total_amount", totalAmount);
        m.put("status", status != null ? status : "CONFIRMED");
        m.put("confirmedAt", confirmedAt);
        m.put("confirmed_at", confirmedAt);
        m.put("cancelledAt", cancelledAt);
        m.put("cancelled_at", cancelledAt);
        m.put("createdAt", createdAt);
        m.put("created_at", createdAt);
        m.put("updatedAt", updatedAt);
        m.put("updated_at", updatedAt);
        return m;
    }

    private static int asInt(Object o, int def) {
        if (o instanceof Number n) return n.intValue();
        if (o != null) {
            try { return Integer.parseInt(o.toString()); } catch (Exception ignored) {}
        }
        return def;
    }

    private static Double asDouble(Object o, Double def) {
        if (o instanceof Number n) return n.doubleValue();
        if (o != null) {
            try { return Double.parseDouble(o.toString()); } catch (Exception ignored) {}
        }
        return def;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRideId() { return rideId; }
    public void setRideId(String rideId) { this.rideId = rideId; }
    public String getPassengerId() { return passengerId; }
    public void setPassengerId(String passengerId) { this.passengerId = passengerId; }
    public String getRideRequestId() { return rideRequestId; }
    public void setRideRequestId(String rideRequestId) { this.rideRequestId = rideRequestId; }
    public int getSeatsBooked() { return seatsBooked; }
    public void setSeatsBooked(int seatsBooked) { this.seatsBooked = seatsBooked; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(String confirmedAt) { this.confirmedAt = confirmedAt; }
    public String getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(String cancelledAt) { this.cancelledAt = cancelledAt; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
