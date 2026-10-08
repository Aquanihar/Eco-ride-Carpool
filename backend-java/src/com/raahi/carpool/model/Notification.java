package com.raahi.carpool.model;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public class Notification {
    private String id;
    private String userId;
    private String type; // booking, alert, match, info
    private String title;
    private String message;
    private String relatedRideId;
    private String relatedRequestId;
    private String relatedBookingId;
    private boolean isRead;
    private String createdAt;

    public Notification() {
        this.id = "n_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 5);
        this.type = "info";
        this.title = "Notification";
        this.isRead = false;
        this.createdAt = Instant.now().toString();
    }

    public static Notification fromMap(Map<String, Object> map) {
        if (map == null) return null;
        Notification n = new Notification();
        if (map.containsKey("id")) n.setId(String.valueOf(map.get("id")));

        if (map.containsKey("userId")) n.setUserId(String.valueOf(map.get("userId")));
        else if (map.containsKey("user_id")) n.setUserId(String.valueOf(map.get("user_id")));

        if (map.containsKey("type")) n.setType(String.valueOf(map.get("type")));
        if (map.containsKey("title")) n.setTitle(String.valueOf(map.get("title")));
        if (map.containsKey("message")) n.setMessage(String.valueOf(map.get("message")));

        if (map.containsKey("relatedRideId")) n.setRelatedRideId(String.valueOf(map.get("relatedRideId")));
        else if (map.containsKey("related_ride_id")) n.setRelatedRideId(String.valueOf(map.get("related_ride_id")));

        if (map.containsKey("relatedRequestId")) n.setRelatedRequestId(String.valueOf(map.get("relatedRequestId")));
        else if (map.containsKey("related_request_id")) n.setRelatedRequestId(String.valueOf(map.get("related_request_id")));

        if (map.containsKey("relatedBookingId")) n.setRelatedBookingId(String.valueOf(map.get("relatedBookingId")));
        else if (map.containsKey("related_booking_id")) n.setRelatedBookingId(String.valueOf(map.get("related_booking_id")));

        if (map.containsKey("isRead")) n.setRead(Boolean.TRUE.equals(map.get("isRead")));
        else if (map.containsKey("is_read")) n.setRead(Boolean.TRUE.equals(map.get("is_read")));

        if (map.containsKey("createdAt")) n.setCreatedAt(String.valueOf(map.get("createdAt")));
        else if (map.containsKey("created_at")) n.setCreatedAt(String.valueOf(map.get("created_at")));

        return n;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("user_id", userId);
        m.put("userId", userId);
        m.put("type", type);
        m.put("title", title);
        m.put("message", message);
        m.put("related_ride_id", relatedRideId);
        m.put("relatedRideId", relatedRideId);
        m.put("related_request_id", relatedRequestId);
        m.put("relatedRequestId", relatedRequestId);
        m.put("related_booking_id", relatedBookingId);
        m.put("relatedBookingId", relatedBookingId);
        m.put("is_read", isRead);
        m.put("isRead", isRead);
        m.put("read", isRead);
        m.put("created_at", createdAt);
        m.put("createdAt", createdAt);
        return m;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getRelatedRideId() { return relatedRideId; }
    public void setRelatedRideId(String relatedRideId) { this.relatedRideId = relatedRideId; }
    public String getRelatedRequestId() { return relatedRequestId; }
    public void setRelatedRequestId(String relatedRequestId) { this.relatedRequestId = relatedRequestId; }
    public String getRelatedBookingId() { return relatedBookingId; }
    public void setRelatedBookingId(String relatedBookingId) { this.relatedBookingId = relatedBookingId; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
