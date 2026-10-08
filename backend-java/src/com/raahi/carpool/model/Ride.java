package com.raahi.carpool.model;

import java.time.Instant;
import java.util.*;

public class Ride {
    private String id;
    private String driverId;
    private String driverName;
    private double driverRating;
    private int driverTrips;
    private boolean driverVerified;

    private String origin;
    private Double originLatitude;
    private Double originLongitude;

    private String destination;
    private Double destinationLatitude;
    private Double destinationLongitude;

    private List<Map<String, Object>> waypoints = new ArrayList<>();

    private String departureDate;
    private String departureTime;

    private int totalSeats;
    private int availableSeats;
    private double pricePerSeat;

    private String vehicleModel;
    private String vehicleColor;
    private String vehiclePlate;

    private List<String> preferences = new ArrayList<>();
    private boolean recurring;
    private String status; // PUBLISHED, active, CANCELLED, COMPLETED

    private String createdAt;
    private String updatedAt;

    public Ride() {
        this.id = "r_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 5);
        this.driverRating = 4.8;
        this.driverTrips = 10;
        this.driverVerified = true;
        this.status = "PUBLISHED";
        this.createdAt = Instant.now().toString();
        this.updatedAt = this.createdAt;
    }

    public static Ride fromMap(Map<String, Object> map) {
        if (map == null) return null;
        Ride r = new Ride();

        if (map.containsKey("id")) r.setId(String.valueOf(map.get("id")));

        // Driver details
        if (map.get("driver") instanceof Map<?, ?> dMap) {
            if (dMap.containsKey("id")) r.setDriverId(String.valueOf(dMap.get("id")));
            if (dMap.containsKey("name")) r.setDriverName(String.valueOf(dMap.get("name")));
            if (dMap.containsKey("rating")) r.setDriverRating(asDouble(dMap.get("rating"), 4.8));
            if (dMap.containsKey("trips")) r.setDriverTrips(asInt(dMap.get("trips"), 10));
            if (dMap.containsKey("verified")) r.setDriverVerified(Boolean.TRUE.equals(dMap.get("verified")));
        }
        if (map.containsKey("driverId") && r.getDriverId() == null) r.setDriverId(String.valueOf(map.get("driverId")));
        if (map.containsKey("driver_id") && r.getDriverId() == null) r.setDriverId(String.valueOf(map.get("driver_id")));
        if (map.containsKey("driverName") && r.getDriverName() == null) r.setDriverName(String.valueOf(map.get("driverName")));

        // Origin / From
        if (map.get("from") instanceof Map<?, ?> fMap) {
            if (fMap.containsKey("name")) r.setOrigin(String.valueOf(fMap.get("name")));
            if (fMap.containsKey("lat")) r.setOriginLatitude(asDouble(fMap.get("lat"), null));
            if (fMap.containsKey("lng")) r.setOriginLongitude(asDouble(fMap.get("lng"), null));
        } else if (map.containsKey("origin")) {
            r.setOrigin(String.valueOf(map.get("origin")));
            if (map.containsKey("origin_latitude")) r.setOriginLatitude(asDouble(map.get("origin_latitude"), null));
            if (map.containsKey("origin_longitude")) r.setOriginLongitude(asDouble(map.get("origin_longitude"), null));
        }

        // Destination / To
        if (map.get("to") instanceof Map<?, ?> tMap) {
            if (tMap.containsKey("name")) r.setDestination(String.valueOf(tMap.get("name")));
            if (tMap.containsKey("lat")) r.setDestinationLatitude(asDouble(tMap.get("lat"), null));
            if (tMap.containsKey("lng")) r.setDestinationLongitude(asDouble(tMap.get("lng"), null));
        } else if (map.containsKey("destination")) {
            r.setDestination(String.valueOf(map.get("destination")));
            if (map.containsKey("destination_latitude")) r.setDestinationLatitude(asDouble(map.get("destination_latitude"), null));
            if (map.containsKey("destination_longitude")) r.setDestinationLongitude(asDouble(map.get("destination_longitude"), null));
        }

        // Waypoints
        if (map.get("waypoints") instanceof List<?> wList) {
            List<Map<String, Object>> wp = new ArrayList<>();
            for (Object item : wList) {
                if (item instanceof Map<?, ?> wm) {
                    Map<String, Object> casted = new HashMap<>();
                    wm.forEach((k, v) -> casted.put(String.valueOf(k), v));
                    wp.add(casted);
                }
            }
            r.setWaypoints(wp);
        }

        // Date & Time
        if (map.containsKey("date")) r.setDepartureDate(String.valueOf(map.get("date")));
        else if (map.containsKey("departureDate")) r.setDepartureDate(String.valueOf(map.get("departureDate")));
        else if (map.containsKey("departure_date")) r.setDepartureDate(String.valueOf(map.get("departure_date")));

        if (map.containsKey("time")) r.setDepartureTime(String.valueOf(map.get("time")));
        else if (map.containsKey("departureTime")) r.setDepartureTime(String.valueOf(map.get("departureTime")));
        else if (map.containsKey("departure_time")) r.setDepartureTime(String.valueOf(map.get("departure_time")));

        // Seats
        int seats = 1;
        if (map.containsKey("seats")) seats = asInt(map.get("seats"), 1);
        else if (map.containsKey("totalSeats")) seats = asInt(map.get("totalSeats"), 1);
        else if (map.containsKey("total_seats")) seats = asInt(map.get("total_seats"), 1);
        r.setTotalSeats(seats);

        int avail = seats;
        if (map.containsKey("seatsAvailable")) avail = asInt(map.get("seatsAvailable"), seats);
        else if (map.containsKey("availableSeats")) avail = asInt(map.get("availableSeats"), seats);
        else if (map.containsKey("available_seats")) avail = asInt(map.get("available_seats"), seats);
        r.setAvailableSeats(avail);

        // Price
        double price = 0;
        if (map.containsKey("price")) price = asDouble(map.get("price"), 0.0);
        else if (map.containsKey("pricePerSeat")) price = asDouble(map.get("pricePerSeat"), 0.0);
        else if (map.containsKey("price_per_seat")) price = asDouble(map.get("price_per_seat"), 0.0);
        r.setPricePerSeat(price);

        // Vehicle
        if (map.get("vehicle") instanceof Map<?, ?> vMap) {
            if (vMap.containsKey("model")) r.setVehicleModel(String.valueOf(vMap.get("model")));
            if (vMap.containsKey("color")) r.setVehicleColor(String.valueOf(vMap.get("color")));
            if (vMap.containsKey("plate")) r.setVehiclePlate(String.valueOf(vMap.get("plate")));
            else if (vMap.containsKey("registration_number")) r.setVehiclePlate(String.valueOf(vMap.get("registration_number")));
        } else {
            if (map.containsKey("vehicleModel")) r.setVehicleModel(String.valueOf(map.get("vehicleModel")));
            if (map.containsKey("vehicleColor")) r.setVehicleColor(String.valueOf(map.get("vehicleColor")));
            if (map.containsKey("vehiclePlate")) r.setVehiclePlate(String.valueOf(map.get("vehiclePlate")));
        }

        // Status
        if (map.containsKey("status")) r.setStatus(String.valueOf(map.get("status")));

        if (map.containsKey("recurring")) r.setRecurring(Boolean.TRUE.equals(map.get("recurring")));

        return r;
    }

    /**
     * Maps to Supabase database row format
     */
    public Map<String, Object> toSupabaseMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);

        Map<String, Object> driverMap = new LinkedHashMap<>();
        driverMap.put("id", driverId != null ? driverId : "u_driver");
        driverMap.put("name", driverName != null ? driverName : "Verified Driver");
        driverMap.put("rating", driverRating);
        driverMap.put("trips", driverTrips);
        driverMap.put("verified", driverVerified);
        m.put("driver", driverMap);

        Map<String, Object> fromMap = new LinkedHashMap<>();
        fromMap.put("name", origin != null ? origin : "Unknown Origin");
        fromMap.put("lat", originLatitude != null ? originLatitude : 19.1364);
        fromMap.put("lng", originLongitude != null ? originLongitude : 72.8296);
        m.put("from", fromMap);

        Map<String, Object> toMap = new LinkedHashMap<>();
        toMap.put("name", destination != null ? destination : "Unknown Destination");
        toMap.put("lat", destinationLatitude != null ? destinationLatitude : 19.0596);
        toMap.put("lng", destinationLongitude != null ? destinationLongitude : 72.8656);
        m.put("to", toMap);

        m.put("waypoints", waypoints != null ? waypoints : Collections.emptyList());
        m.put("date", departureDate);
        m.put("time", departureTime);
        m.put("seats", totalSeats);
        m.put("seatsAvailable", availableSeats);
        m.put("price", (int) Math.round(pricePerSeat));

        Map<String, Object> vMap = new LinkedHashMap<>();
        vMap.put("model", vehicleModel != null ? vehicleModel : "Sedan");
        vMap.put("color", vehicleColor != null ? vehicleColor : "White");
        vMap.put("plate", vehiclePlate != null ? vehiclePlate : "MH-01-AB-1234");
        m.put("vehicle", vMap);

        m.put("preferences", preferences != null ? preferences : Collections.emptyList());
        m.put("recurring", recurring);
        m.put("status", status != null ? status : "PUBLISHED");
        return m;
    }

    /**
     * Maps to standard API representation for Frontend
     */
    public Map<String, Object> toApiMap() {
        Map<String, Object> m = toSupabaseMap();
        // Additional convenience fields for Next.js endpoints
        m.put("driver_id", driverId);
        m.put("origin", origin);
        m.put("destination", destination);
        m.put("origin_latitude", originLatitude);
        m.put("origin_longitude", originLongitude);
        m.put("destination_latitude", destinationLatitude);
        m.put("destination_longitude", destinationLongitude);
        m.put("departure_date", departureDate);
        m.put("departure_time", departureTime);
        m.put("total_seats", totalSeats);
        m.put("available_seats", availableSeats);
        m.put("price_per_seat", pricePerSeat);
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
    public String getDriverId() { return driverId; }
    public void setDriverId(String driverId) { this.driverId = driverId; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public double getDriverRating() { return driverRating; }
    public void setDriverRating(double driverRating) { this.driverRating = driverRating; }
    public int getDriverTrips() { return driverTrips; }
    public void setDriverTrips(int driverTrips) { this.driverTrips = driverTrips; }
    public boolean isDriverVerified() { return driverVerified; }
    public void setDriverVerified(boolean driverVerified) { this.driverVerified = driverVerified; }
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public Double getOriginLatitude() { return originLatitude; }
    public void setOriginLatitude(Double originLatitude) { this.originLatitude = originLatitude; }
    public Double getOriginLongitude() { return originLongitude; }
    public void setOriginLongitude(Double originLongitude) { this.originLongitude = originLongitude; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public Double getDestinationLatitude() { return destinationLatitude; }
    public void setDestinationLatitude(Double destinationLatitude) { this.destinationLatitude = destinationLatitude; }
    public Double getDestinationLongitude() { return destinationLongitude; }
    public void setDestinationLongitude(Double destinationLongitude) { this.destinationLongitude = destinationLongitude; }
    public List<Map<String, Object>> getWaypoints() { return waypoints; }
    public void setWaypoints(List<Map<String, Object>> waypoints) { this.waypoints = waypoints; }
    public String getDepartureDate() { return departureDate; }
    public void setDepartureDate(String departureDate) { this.departureDate = departureDate; }
    public String getDepartureTime() { return departureTime; }
    public void setDepartureTime(String departureTime) { this.departureTime = departureTime; }
    public int getTotalSeats() { return totalSeats; }
    public void setTotalSeats(int totalSeats) { this.totalSeats = totalSeats; }
    public int getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(int availableSeats) { this.availableSeats = availableSeats; }
    public double getPricePerSeat() { return pricePerSeat; }
    public void setPricePerSeat(double pricePerSeat) { this.pricePerSeat = pricePerSeat; }
    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }
    public String getVehicleColor() { return vehicleColor; }
    public void setVehicleColor(String vehicleColor) { this.vehicleColor = vehicleColor; }
    public String getVehiclePlate() { return vehiclePlate; }
    public void setVehiclePlate(String vehiclePlate) { this.vehiclePlate = vehiclePlate; }
    public List<String> getPreferences() { return preferences; }
    public void setPreferences(List<String> preferences) { this.preferences = preferences; }
    public boolean isRecurring() { return recurring; }
    public void setRecurring(boolean recurring) { this.recurring = recurring; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
