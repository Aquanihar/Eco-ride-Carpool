package com.raahi.carpool.service;

import com.raahi.carpool.config.AppConfig;
import com.raahi.carpool.server.SimpleJson;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

public class SupabaseClient {
    private final String baseUrl;
    private final String apiKey;
    private final HttpClient httpClient;

    public SupabaseClient() {
        this.baseUrl = AppConfig.getSupabaseUrl().replaceAll("/+$", "");
        this.apiKey = AppConfig.getSupabaseKey();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    private HttpRequest.Builder baseRequestBuilder(String pathAndQuery) {
        String url = baseUrl + "/rest/v1/" + pathAndQuery.replaceFirst("^/+", "");
        return HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .header("apikey", apiKey)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json");
    }

    /**
     * Executes GET query on Supabase table
     */
    public List<Map<String, Object>> query(String table, String queryString) {
        try {
            String path = table + (queryString != null && !queryString.isBlank() ? "?" + queryString : "");
            HttpRequest request = baseRequestBuilder(path)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                List<Object> rawList = SimpleJson.parseArray(response.body());
                List<Map<String, Object>> result = new ArrayList<>();
                for (Object item : rawList) {
                    if (item instanceof Map<?, ?> m) {
                        Map<String, Object> casted = new LinkedHashMap<>();
                        m.forEach((k, v) -> casted.put(String.valueOf(k), v));
                        result.add(casted);
                    }
                }
                return result;
            } else {
                System.err.println("Supabase query error [" + response.statusCode() + "]: " + response.body());
            }
        } catch (Exception e) {
            System.err.println("Supabase query exception: " + e.getMessage());
        }
        return Collections.emptyList();
    }

    /**
     * Inserts single row into Supabase table
     */
    public Map<String, Object> insert(String table, Map<String, Object> data) {
        try {
            String jsonPayload = SimpleJson.stringify(List.of(data));
            HttpRequest request = baseRequestBuilder(table)
                    .header("Prefer", "return=representation")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                List<Object> arr = SimpleJson.parseArray(response.body());
                if (!arr.isEmpty() && arr.get(0) instanceof Map<?, ?> m) {
                    Map<String, Object> casted = new LinkedHashMap<>();
                    m.forEach((k, v) -> casted.put(String.valueOf(k), v));
                    return casted;
                }
            } else {
                System.err.println("Supabase insert error on [" + table + "]: " + response.body());
            }
        } catch (Exception e) {
            System.err.println("Supabase insert exception on [" + table + "]: " + e.getMessage());
        }
        return null;
    }

    /**
     * Updates rows matching filter query
     */
    public boolean update(String table, String filterQuery, Map<String, Object> updateFields) {
        try {
            String path = table + "?" + filterQuery;
            String jsonPayload = SimpleJson.stringify(updateFields);
            HttpRequest request = baseRequestBuilder(path)
                    .header("Prefer", "return=representation")
                    .method("PATCH", HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return true;
            } else {
                System.err.println("Supabase update error on [" + table + "]: " + response.body());
            }
        } catch (Exception e) {
            System.err.println("Supabase update exception on [" + table + "]: " + e.getMessage());
        }
        return false;
    }

    /**
     * Checks if Supabase connection is healthy
     */
    public boolean checkHealth() {
        try {
            HttpRequest request = baseRequestBuilder("rides?limit=1")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (Exception e) {
            return false;
        }
    }
}
