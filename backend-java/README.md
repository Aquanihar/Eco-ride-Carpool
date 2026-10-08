# Raahi Carpool - Java Backend Service

High-performance, lightweight Java backend for the Raahi Carpooling Platform with native **Supabase Database** integration.

---

## 🌟 Key Features

1. **Offer / Post a Ride (`POST /api/rides`)**
   - Validates route (origin, destination, waypoints), schedule (date & time), available seats, vehicle details, and pricing.
   - Saves directly to Supabase `rides` table with local concurrency caching.

2. **Search Rides (`GET /api/rides`)**
   - Filters active rides by pickup/destination keywords, date, and passenger capacity.
   - Automatically excludes departed or fully booked rides.

3. **Book / Request a Ride (`POST /api/rides/{rideId}/requests`)**
   - Passenger creates a `PENDING` booking request.
   - Prevents self-booking by drivers and duplicate active requests.
   - **Important**: Available seats are preserved (not prematurely deducted) until the driver confirms.
   - Automatically sends notification to the driver.

4. **Accept Ride Request (`POST /api/ride-requests/{requestId}/accept`)**
   - Driver authorizes the request.
   - Concurrency-safe atomic check verifies seat availability.
   - Decrements available seats and syncs with Supabase.
   - Transitions request to `ACCEPTED` and generates a `CONFIRMED` booking.
   - Notifies passenger of acceptance.

5. **Reject / Cancel Workflows**
   - Driver can reject pending requests (`POST /api/ride-requests/{requestId}/reject`).
   - Passenger can cancel pending requests (`POST /api/ride-requests/{requestId}/cancel`).
   - Passenger can cancel confirmed bookings, which releases and restores seats back to the ride (`POST /api/bookings/{bookingId}/cancel`).
   - Driver can cancel an entire ride (`POST /api/rides/{rideId}/cancel`), automatically notifying all booked passengers.

6. **Java 26 & Virtual Threads**
   - Built on Java standard library HTTP server (`com.sun.net.httpserver.HttpServer`) powered by Java virtual threads (`Executors.newVirtualThreadPerTaskExecutor()`).
   - Zero external JAR dependencies required — compiles and runs out of the box with standard `javac` and `java`.

---

## 🚀 How to Run

### Option 1: Using npm (from project root)
```bash
npm run backend:java
```

### Option 2: Using PowerShell (Windows)
```powershell
.\backend-java\run.ps1
```

### Option 3: Using Command Prompt / Batch
```cmd
backend-java\run.bat
```

### Run Automated Tests
```powershell
$sources = Get-ChildItem -Path backend-java/src -Filter *.java -Recurse | Select-Object -ExpandProperty FullName
javac -d backend-java/bin $sources
java -cp backend-java/bin com.raahi.carpool.test.RideBackendTest
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck & Supabase connectivity status |
| `POST` | `/api/rides` | Offer / Post a new ride |
| `GET` | `/api/rides` | Search rides (`origin`, `destination`, `date`, `passengerCount`) |
| `GET` | `/api/rides/{rideId}` | Get ride details |
| `POST` | `/api/rides/{rideId}/requests` | Book a ride (send ride request) |
| `GET` | `/api/rides/{rideId}/requests` | Driver views incoming requests for a ride |
| `POST` | `/api/ride-requests/{requestId}/accept` | Driver accepts request (deducts seats, confirms booking) |
| `POST` | `/api/ride-requests/{requestId}/reject` | Driver rejects request |
| `POST` | `/api/ride-requests/{requestId}/cancel` | Passenger cancels pending request |
| `POST` | `/api/bookings/{bookingId}/cancel` | Passenger cancels booking (restores seats) |
| `POST` | `/api/rides/{rideId}/cancel` | Driver cancels entire ride |
| `GET` | `/api/notifications?userId={id}` | Get user notifications |
| `GET` | `/api/driver/requests?driverId={id}` | Driver dashboard: all incoming requests |

---

## 💾 Supabase Setup

The service connects to Supabase using credentials in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`

If you want to create dedicated SQL tables and indexes in your Supabase dashboard, execute `backend-java/supabase_schema.sql` in the Supabase SQL Editor.
