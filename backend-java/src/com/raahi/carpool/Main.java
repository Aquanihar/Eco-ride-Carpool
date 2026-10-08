package com.raahi.carpool;

import com.raahi.carpool.config.AppConfig;
import com.raahi.carpool.server.CarpoolHttpServer;
import com.raahi.carpool.service.RideService;
import com.raahi.carpool.service.SupabaseClient;

public class Main {
    public static void main(String[] args) {
        System.out.println("Starting Raahi Carpool Java Backend Service...");

        int port = AppConfig.getServerPort();
        SupabaseClient supabaseClient = new SupabaseClient();
        RideService rideService = new RideService(supabaseClient);
        CarpoolHttpServer server = new CarpoolHttpServer(port, rideService, supabaseClient);

        try {
            server.start();

            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("Shutting down Raahi Carpool Java Backend...");
                server.stop();
            }));

            // Keep main thread alive
            Thread.currentThread().join();
        } catch (Exception e) {
            System.err.println("Failed to start server: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
