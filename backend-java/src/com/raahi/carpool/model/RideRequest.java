package com.raahi.carpool.model;

import java.time.Instant;
import java.util.*;

public class RideRequest {
    private String id;
    private String rideId;
    private String passengerId;
    private String passengerName;
    private double passengerRating;
    private int seatsRequested;

    private String pickupLocation;
    private Double pickupLatitude;
    private Double pickupLongitude;

    private String dropLocation;
    private Double dropLatitude;
    private Double dropLongitude;

    private String message;
    private String status; // PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED

    private String createdAt;
    private String updatedAt;

    public RideRequest() {
        this.id = "req_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 5);
        this.status = "PENDING";
        this.seatsRequested = 1;
        this.passengerRating = 4.9;
        this.createdAt = Instant.now().toString();
        this.updatedAt = this.createdAt;
    }

    public static RideRequest fromMap(Map<String, Object> map) {
        if (map == null) return null;
        RideRequest r = new RideRequest();
        if (map.containsKey("id")) r.setId(String.valueOf(map.get("id")));

        if (map.containsKey("rideId")) r.setRideId(String.valueOf(map.get("rideId")));
        else if (map.containsKey("ride_id")) r.setRideId(String.valueOf(map.get("ride_id")));

        if (map.containsKey("passengerId")) r.setPassengerId(String.valueOf(map.get("passengerId")));
        else if (map.containsKey("passenger_id")) r.setPassengerId(String.valueOf(map.get("passenger_id")));

        if (map.containsKey("passengerName")) r.setPassengerName(String.valueOf(map.get("passengerName")));
        else if (map.containsKey("passenger_name")) r.setPassengerName(String.valueOf(map.get("passenger_name")));

        if (map.containsKey("passengerRating")) r.setPassengerRating(asDouble(map.get("passengerRating"), 4.9));
        else if (map.containsKey("passenger_rating")) r.setPassengerRating(asDouble(map.get("passenger_rating"), 4.9));

        if (map.containsKey("seatsRequested")) r.setSeatsRequested(asInt(map.get("seatsRequested"), 1));
        else if (map.containsKey("seats_requested")) r.setSeatsRequested(asInt(map.get("seats_requested"), 1));

        if (map.containsKey("pickupLocation")) r.setPickupLocation(String.valueOf(map.get("pickupLocation")));
        else if (map.containsKey("pickup_location")) r.setPickupLocation(String.valueOf(map.get("pickup_location")));

        if (map.containsKey("pickupLatitude")) r.setPickupLatitude(asDouble(map.get("pickupLatitude"), null));
        else if (map.containsKey("pickup_latitude")) r.setPickupLatitude(asDouble(map.get("pickup_latitude"), null));

        if (map.containsKey("pickupLongitude")) r.setPickupLongitude(asDouble(map.get("pickupLongitude"), null));
        else if (map.containsKey("pickup_longitude")) r.setPickupLongitude(asDouble(map.get("pickup_longitude"), null));

        if (map.containsKey("dropLocation")) r.setDropLocation(String.valueOf(map.get("dropLocation")));
        else if (map.containsKey("drop_location")) r.setDropLocation(String.valueOf(map.get("drop_location")));

        if (map.containsKey("dropLatitude")) r.setDropLatitude(asDouble(map.get("dropLatitude"), null));
        else if (map.containsKey("drop_latitude")) r.setDropLatitude(asDouble(map.get("drop_latitude"), null));

        if (map.containsKey("dropLongitude")) r.setDropLongitude(asDouble(map.get("dropLongitude"), null));
        else if (map.containsKey("drop_longitude")) r.setDropLongitude(asDouble(map.get("drop_longitude"), null));

        if (map.containsKey("message")) r.setMessage(String.valueOf(map.get("message")));
        if (map.containsKey("status")) r.setStatus(String.valueOf(map.get("status")));
        if (map.containsKey("createdAt")) r.setCreatedAt(String.valueOf(map.get("createdAt")));
        else if (map.containsKey("created_at")) r.setCreatedAt(String.valueOf(map.get("created_at")));

        if (map.containsKey("updatedAt")) r.setUpdatedAt(String.valueOf(map.get("updatedAt")));
        else if (map.containsKey("updated_at")) r.setUpdatedAt(String.valueOf(map.get("updated_at")));

        return r;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("ride_id", rideId);
        m.put("rideId", rideId);
        m.put("passenger_id", passengerId);
        m.put("passengerId", passengerId);
        m.put("passenger_name", passengerName != null ? passengerName : "Passenger");
        m.put("passengerName", passengerName != null ? passengerName : "Passenger");
        m.put("passenger_rating", passengerRating);
        m.put("passengerRating", passengerRating);
        m.put("seats_requested", seatsRequested);
        m.put("seatsRequested", seatsRequested);
        m.put("pickup_location", pickupLocation != null ? pickupLocation : "");
        m.put("pickupLocation", pickupLocation != null ? pickupLocation : "");
        m.put("pickup_latitude", pickupLatitude);
        m.put("pickup_longitude", pickupLongitude);
        m.put("drop_location", dropLocation != null ? dropLocation : "");
        m.put("dropLocation", dropLocation != null ? dropLocation : "");
        m.put("drop_latitude", dropLatitude);
        m.put("drop_longitude", dropLongitude);
        m.put("message", message != null ? message : "");
        m.put("status", status != null ? status : "PENDING");
        m.put("created_at", createdAt);
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
    public String getPassengerName() { return passengerName; }
    public void setPassengerName(String passengerName) { this.passengerName = passengerName; }
    public double getPassengerRating() { return passengerRating; }
    public void setPassengerRating(double passengerRating) { this.passengerRating = passengerRating; }
    public int getSeatsRequested() { return seatsRequested; }
    public void setSeatsRequested(int seatsRequested) { this.seatsRequested = seatsRequested; }
    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }
    public Double getPickupLatitude() { return pickupLatitude; }
    public void setPickupLatitude(Double pickupLatitude) { this.pickupLatitude = pickupLatitude; }
    public Double getPickupLongitude() { return pickupLongitude; }
    public void setPickupLongitude(Double pickupLongitude) { this.pickupLongitude = pickupLongitude; }
    public String getDropLocation() { return dropLocation; }
    public void setDropLocation(String dropLocation) { this.dropLocation = dropLocation; }
    public Double getDropLatitude() { return dropLatitude; }
    public void setDropLatitude(Double dropLatitude) { this.dropLatitude = dropLatitude; }
    public Double getDropLongitude() { return dropLongitude; }
    public void setDropLongitude(Double dropLongitude) { this.dropLongitude = dropLongitude; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
