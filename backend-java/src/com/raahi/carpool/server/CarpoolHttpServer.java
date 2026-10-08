package com.raahi.carpool.server;

import com.raahi.carpool.config.AppConfig;
import com.raahi.carpool.model.Ride;
import com.raahi.carpool.model.RideRequest;
import com.raahi.carpool.service.RideService;
import com.raahi.carpool.service.SupabaseClient;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.*;
import java.util.concurrent.Executors;

public class CarpoolHttpServer {
    private final int port;
    private final RideService rideService;
    private final SupabaseClient supabaseClient;
    private HttpServer server;

    public CarpoolHttpServer(int port, RideService rideService, SupabaseClient supabaseClient) {
        this.port = port;
        this.rideService = rideService;
        this.supabaseClient = supabaseClient;
    }

    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);
        // Using Java 26 virtual threads for high concurrency
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());

        server.createContext("/api/health", this::handleHealth);
        server.createContext("/api/rides", this::handleRides);
        server.createContext("/api/ride-requests", this::handleRideRequests);
        server.createContext("/api/bookings", this::handleBookings);
        server.createContext("/api/notifications", this::handleNotifications);
        server.createContext("/api/driver/requests", this::handleDriverRequests);

        server.start();
        System.out.println("=================================================");
        System.out.println("  Raahi Carpool Java Backend Server Running!");
        System.out.println("  Port: " + port);
        System.out.println("  Supabase URL: " + supabaseClient.getBaseUrl());
        System.out.println("  Endpoints: /api/rides, /api/ride-requests, /api/health");
        System.out.println("=================================================");
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
        }
    }

    private void handleHealth(HttpExchange exchange) throws IOException {
        if (HttpUtils.handleOptions(exchange)) return;
        boolean sbOk = supabaseClient.checkHealth();
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "UP");
        resp.put("service", "Raahi Carpool Java Backend");
        resp.put("supabase_connected", sbOk);
        resp.put("supabase_url", supabaseClient.getBaseUrl());
        resp.put("time", new Date().toString());
        HttpUtils.sendJsonResponse(exchange, 200, resp);
    }

    private void handleNotifications(HttpExchange exchange) throws IOException {
        if (HttpUtils.handleOptions(exchange)) return;
        Map<String, String> params = HttpUtils.parseQueryParams(exchange);
        String userId = params.getOrDefault("userId", params.get("user_id"));
        if (userId == null || userId.isBlank()) {
            HttpUtils.sendError(exchange, 400, "Missing userId parameter.", "VALIDATION_ERROR");
            return;
        }

        List<Map<String, Object>> notifs = rideService.getNotificationsByUserId(userId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("notifications", notifs);
        resp.put("count", notifs.size());
        HttpUtils.sendJsonResponse(exchange, 200, resp);
    }

    private void handleDriverRequests(HttpExchange exchange) throws IOException {
        if (HttpUtils.handleOptions(exchange)) return;
        Map<String, String> params = HttpUtils.parseQueryParams(exchange);
        String driverId = params.get("driverId");
        List<Map<String, Object>> reqs = rideService.getRequestsByDriverId(driverId);
        HttpUtils.sendJsonResponse(exchange, 200, Map.of("success", true, "requests", reqs));
    }

    /**
     * Handles /api/rides and subpaths like:
     * - POST /api/rides
     * - GET /api/rides
     * - GET /api/rides/{rideId}
     * - POST /api/rides/{rideId}/requests
     * - GET /api/rides/{rideId}/requests
     * - POST /api/rides/{rideId}/cancel
     */
    private void handleRides(HttpExchange exchange) throws IOException {
        if (HttpUtils.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();
        String[] parts = path.split("/"); // ["", "api", "rides", "{rideId}", ...]

        // Case: /api/rides
        if (parts.length == 3 || (parts.length == 4 && parts[3].isBlank())) {
            if ("POST".equals(method)) {
                // Post a new ride
                String body = HttpUtils.readRequestBody(exchange);
                Map<String, Object> map = SimpleJson.parseObject(body);
                Ride ride = Ride.fromMap(map);
                Map<String, Object> result = rideService.createRide(ride);
                int code = Boolean.TRUE.equals(result.get("success")) ? 201 : 400;
                HttpUtils.sendJsonResponse(exchange, code, result);
                return;
            } else if ("GET".equals(method)) {
                // Search rides
                Map<String, String> query = HttpUtils.parseQueryParams(exchange);
                String origin = query.get("origin");
                String destination = query.get("destination");
                String date = query.get("date");
                int passengerCount = 1;
                try {
                    if (query.containsKey("passengerCount")) passengerCount = Integer.parseInt(query.get("passengerCount"));
                    else if (query.containsKey("seats")) passengerCount = Integer.parseInt(query.get("seats"));
                } catch (Exception ignored) {}

                List<Map<String, Object>> rides = rideService.searchRides(origin, destination, date, passengerCount);
                Map<String, Object> resp = new LinkedHashMap<>();
                resp.put("success", true);
                resp.put("rides", rides);
                resp.put("count", rides.size());
                HttpUtils.sendJsonResponse(exchange, 200, resp);
                return;
            }
        }

        // Case: /api/rides/{rideId}
        if (parts.length == 4) {
            String rideId = parts[3];
            if ("GET".equals(method)) {
                Ride ride = rideService.getRideById(rideId);
                if (ride != null) {
                    HttpUtils.sendJsonResponse(exchange, 200, Map.of("success", true, "ride", ride.toApiMap()));
                } else {
                    HttpUtils.sendError(exchange, 404, "Ride not found.", "NOT_FOUND");
                }
                return;
            }
        }

        // Sub-resources under /api/rides/{rideId}/...
        if (parts.length >= 5) {
            String rideId = parts[3];
            String action = parts[4];

            // POST /api/rides/{rideId}/requests -> Passenger requests a ride
            if ("requests".equalsIgnoreCase(action) && "POST".equals(method)) {
                String body = HttpUtils.readRequestBody(exchange);
                Map<String, Object> map = SimpleJson.parseObject(body);
                map.put("rideId", rideId);
                RideRequest req = RideRequest.fromMap(map);
                Map<String, Object> res = rideService.createRideRequest(req);
                int status = (Integer) res.getOrDefault("status", 200);
                HttpUtils.sendJsonResponse(exchange, status, res);
                return;
            }

            // GET /api/rides/{rideId}/requests -> Driver views incoming requests
            if ("requests".equalsIgnoreCase(action) && "GET".equals(method)) {
                List<Map<String, Object>> requests = rideService.getRequestsByRideId(rideId);
                HttpUtils.sendJsonResponse(exchange, 200, Map.of("success", true, "requests", requests));
                return;
            }

            // POST /api/rides/{rideId}/cancel -> Driver cancels ride
            if ("cancel".equalsIgnoreCase(action) && "POST".equals(method)) {
                String body = HttpUtils.readRequestBody(exchange);
                Map<String, Object> map = SimpleJson.parseObject(body);
                String driverId = String.valueOf(map.getOrDefault("driverId", ""));
                Map<String, Object> res = rideService.cancelRide(rideId, driverId);
                int status = Boolean.TRUE.equals(res.get("success")) ? 200 : (Integer) res.getOrDefault("status", 400);
                HttpUtils.sendJsonResponse(exchange, status, res);
                return;
            }
        }

        HttpUtils.sendError(exchange, 404, "Not Found", "NOT_FOUND");
    }

    /**
     * Handles /api/ride-requests/{requestId}/[accept|reject|cancel]
     */
    private void handleRideRequests(HttpExchange exchange) throws IOException {
        if (HttpUtils.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();
        String[] parts = path.split("/"); // ["", "api", "ride-requests", "{requestId}", "{action}"]

        if (parts.length >= 5 && "POST".equals(method)) {
            String requestId = parts[3];
            String action = parts[4];

            String body = HttpUtils.readRequestBody(exchange);
            Map<String, Object> map = SimpleJson.parseObject(body);

            // POST /api/ride-requests/{requestId}/accept -> Driver accepts request
            if ("accept".equalsIgnoreCase(action)) {
                String driverId = String.valueOf(map.getOrDefault("driverId", map.get("driver_id")));
                Map<String, Object> res = rideService.acceptRideRequest(requestId, driverId);
                int status = Boolean.TRUE.equals(res.get("success")) ? 200 : (Integer) res.getOrDefault("status", 400);
                HttpUtils.sendJsonResponse(exchange, status, res);
                return;
            }

            // POST /api/ride-requests/{requestId}/reject -> Driver rejects request
            if ("reject".equalsIgnoreCase(action)) {
                String driverId = String.valueOf(map.getOrDefault("driverId", map.get("driver_id")));
                Map<String, Object> res = rideService.rejectRideRequest(requestId, driverId);
                int status = Boolean.TRUE.equals(res.get("success")) ? 200 : (Integer) res.getOrDefault("status", 400);
                HttpUtils.sendJsonResponse(exchange, status, res);
                return;
            }

            // POST /api/ride-requests/{requestId}/cancel -> Passenger cancels request
            if ("cancel".equalsIgnoreCase(action)) {
                String passengerId = String.valueOf(map.getOrDefault("passengerId", map.get("passenger_id")));
                Map<String, Object> res = rideService.cancelPendingRequest(requestId, passengerId);
                int status = Boolean.TRUE.equals(res.get("success")) ? 200 : (Integer) res.getOrDefault("status", 400);
                HttpUtils.sendJsonResponse(exchange, status, res);
                return;
            }
        }

        HttpUtils.sendError(exchange, 404, "Not Found", "NOT_FOUND");
    }

    /**
     * Handles /api/bookings/{bookingId}/cancel
     */
    private void handleBookings(HttpExchange exchange) throws IOException {
        if (HttpUtils.handleOptions(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();
        String[] parts = path.split("/");

        if (parts.length >= 5 && "POST".equals(method)) {
            String bookingId = parts[3];
            String action = parts[4];

            if ("cancel".equalsIgnoreCase(action)) {
                String body = HttpUtils.readRequestBody(exchange);
                Map<String, Object> map = SimpleJson.parseObject(body);
                String passengerId = String.valueOf(map.getOrDefault("passengerId", map.get("passenger_id")));
                Map<String, Object> res = rideService.cancelBooking(bookingId, passengerId);
                int status = Boolean.TRUE.equals(res.get("success")) ? 200 : (Integer) res.getOrDefault("status", 400);
                HttpUtils.sendJsonResponse(exchange, status, res);
                return;
            }
        }

        HttpUtils.sendError(exchange, 404, "Not Found", "NOT_FOUND");
    }
}
