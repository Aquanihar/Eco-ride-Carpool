package com.raahi.carpool.config;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class AppConfig {
    private static final Map<String, String> envMap = new HashMap<>();

    static {
        loadDotEnv("../.env.local");
        loadDotEnv(".env.local");
        loadDotEnv("../.env");
        loadDotEnv(".env");
    }

    private static void loadDotEnv(String relativePath) {
        File file = new File(relativePath);
        if (!file.exists()) return;

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int eq = line.indexOf('=');
                if (eq > 0) {
                    String key = line.substring(0, eq).trim();
                    String val = line.substring(eq + 1).trim();
                    if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length() - 1);
                    }
                    envMap.putIfAbsent(key, val);
                }
            }
        } catch (IOException ignored) {}
    }

    public static String get(String key, String defaultValue) {
        String sysProp = System.getProperty(key);
        if (sysProp != null && !sysProp.isBlank()) return sysProp;

        String sysEnv = System.getenv(key);
        if (sysEnv != null && !sysEnv.isBlank()) return sysEnv;

        String fileVal = envMap.get(key);
        if (fileVal != null && !fileVal.isBlank()) return fileVal;

        return defaultValue;
    }

    public static int getInt(String key, int defaultValue) {
        String val = get(key, null);
        if (val == null) return defaultValue;
        try {
            return Integer.parseInt(val);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public static String getSupabaseUrl() {
        return get("NEXT_PUBLIC_SUPABASE_URL", get("SUPABASE_URL", "https://lsvsquzofjgvuhfksfqi.supabase.co"));
    }

    public static String getSupabaseKey() {
        return get("SUPABASE_SERVICE_ROLE_KEY", get("NEXT_PUBLIC_SUPABASE_ANON_KEY", get("SUPABASE_KEY", "sb_publishable_p2ITbNifbZgsFUXd3uqeGQ_Wi9HuxUW")));
    }

    public static int getServerPort() {
        return getInt("PORT", getInt("BACKEND_PORT", 8080));
    }
}
