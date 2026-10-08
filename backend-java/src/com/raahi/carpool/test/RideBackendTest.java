package com.raahi.carpool.test;

import com.raahi.carpool.model.Ride;
import com.raahi.carpool.model.RideRequest;
import com.raahi.carpool.service.RideService;
import com.raahi.carpool.service.SupabaseClient;

import java.util.List;
import java.util.Map;

public class RideBackendTest {
    private static int passed = 0;
    private static int failed = 0;

    private static void assertTrue(boolean condition, String testName) {
        if (condition) {
            System.out.println("✅ [PASS] " + testName);
            passed++;
        } else {
            System.err.println("❌ [FAIL] " + testName);
            failed++;
        }
    }

    private static void assertEquals(Object expected, Object actual, String testName) {
        if (expected == null && actual == null) {
            System.out.println("✅ [PASS] " + testName);
            passed++;
            return;
        }
        if (expected != null && expected.equals(actual)) {
            System.out.println("✅ [PASS] " + testName);
            passed++;
        } else {
            System.err.println("❌ [FAIL] " + testName + " | Expected: " + expected + ", Got: " + actual);
            failed++;
        }
    }

    public static void main(String[] args) {
        System.out.println("=============================================================");
        System.out.println("  RUNNING RAAHI CARPOOL BACKEND JAVA VERIFICATION TESTS");
        System.out.println("=============================================================\n");

        SupabaseClient supabase = new SupabaseClient();
        RideService service = new RideService(supabase);
        service.clearAll();

        // -------------------------------------------------------------
        // Test 1: Driver Posts / Offers a Ride
        // -------------------------------------------------------------
        Ride ride = new Ride();
        ride.setId("r_test_101");
        ride.setDriverId("driver_raj");
        ride.setDriverName("Rajesh Kumar");
        ride.setOrigin("Andheri West, Mumbai");
        ride.setDestination("Bandra Kurla Complex");
        ride.setDepartureDate("2026-10-25");
        ride.setDepartureTime("09:00");
        ride.setTotalSeats(3);
        ride.setAvailableSeats(3);
        ride.setPricePerSeat(90.0);
        ride.setVehicleModel("Tata Nexon EV");
        ride.setVehicleColor("Teal Blue");
        ride.setVehiclePlate("MH-02-EE-9999");
        ride.setStatus("PUBLISHED");

        Map<String, Object> postRes = service.createRide(ride);
        assertTrue(Boolean.TRUE.equals(postRes.get("success")), "Test 1: Ride posted successfully");
        Ride storedRide = service.getRideById("r_test_101");
        assertEquals(3, storedRide.getAvailableSeats(), "Test 1: Available seats initialized to 3");

        // -------------------------------------------------------------
        // Test 2: Search for the Offered Ride
        // -------------------------------------------------------------
        List<Map<String, Object>> searchRes = service.searchRides("Andheri", "Bandra", "2026-10-25", 1);
        assertTrue(!searchRes.isEmpty(), "Test 2: Search found offered ride by route & date");

        // -------------------------------------------------------------
        // Test 3: Passenger 1 Requests / Books 2 Seats
        // -------------------------------------------------------------
        RideRequest req1 = new RideRequest();
        req1.setId("req_pass_1");
        req1.setRideId("r_test_101");
        req1.setPassengerId("pass_simran");
        req1.setPassengerName("Simran Kaur");
        req1.setSeatsRequested(2);
        req1.setPickupLocation("DN Nagar Metro");
        req1.setDropLocation("BKC Diamond Bourse");
        req1.setMessage("Need 2 seats for office commute");

        Map<String, Object> reqRes1 = service.createRideRequest(req1);
        assertTrue(Boolean.TRUE.equals(reqRes1.get("success")), "Test 3: Passenger 1 request submitted successfully");
        assertEquals("PENDING", req1.getStatus(), "Test 3: Ride request initial status is PENDING");
        // Verify available seats remain unchanged before driver acceptance!
        Ride rideAfterReq = service.getRideById("r_test_101");
        assertEquals(3, rideAfterReq.getAvailableSeats(), "Test 3: Available seats unchanged (3) while request is PENDING");

        // -------------------------------------------------------------
        // Test 4: Driver Accepts Passenger 1's Request
        // -------------------------------------------------------------
        Map<String, Object> acceptRes1 = service.acceptRideRequest("req_pass_1", "driver_raj");
        assertTrue(Boolean.TRUE.equals(acceptRes1.get("success")), "Test 4: Driver accepts request");
        assertEquals("ACCEPTED", req1.getStatus(), "Test 4: Request status updated to ACCEPTED");
        Ride rideAfterAccept = service.getRideById("r_test_101");
        assertEquals(1, rideAfterAccept.getAvailableSeats(), "Test 4: Available seats decremented from 3 to 1 (3 - 2 = 1)");

        // Check confirmed booking generated
        @SuppressWarnings("unchecked")
        Map<String, Object> acceptData = (Map<String, Object>) acceptRes1.get("data");
        @SuppressWarnings("unchecked")
        Map<String, Object> bookingData = (Map<String, Object>) acceptData.get("booking");
        assertEquals("CONFIRMED", bookingData.get("status"), "Test 4: Booking status is CONFIRMED");
        assertEquals(180.0, ((Number) bookingData.get("total_amount")).doubleValue(), "Test 4: Booking amount is correct (2 * 90 = 180)");

        // -------------------------------------------------------------
        // Test 5: Overbooking Protection
        // Passenger 2 tries to request 2 seats when only 1 is available
        // -------------------------------------------------------------
        RideRequest reqOverbook = new RideRequest();
        reqOverbook.setId("req_overbook");
        reqOverbook.setRideId("r_test_101");
        reqOverbook.setPassengerId("pass_over");
        reqOverbook.setPassengerName("Overbook Passenger");
        reqOverbook.setSeatsRequested(2); // Only 1 left!

        Map<String, Object> overbookRes = service.createRideRequest(reqOverbook);
        assertTrue(Boolean.FALSE.equals(overbookRes.get("success")), "Test 5: Overbooking prevented at request time");
        assertEquals("INSUFFICIENT_SEATS", overbookRes.get("errorCode"), "Test 5: Error code is INSUFFICIENT_SEATS");

        // -------------------------------------------------------------
        // Test 6: Passenger 3 Requests 1 Seat, Driver Rejects
        // -------------------------------------------------------------
        RideRequest req3 = new RideRequest();
        req3.setId("req_pass_3");
        req3.setRideId("r_test_101");
        req3.setPassengerId("pass_amit");
        req3.setPassengerName("Amit Roy");
        req3.setSeatsRequested(1);

        service.createRideRequest(req3);
        Map<String, Object> rejectRes = service.rejectRideRequest("req_pass_3", "driver_raj");
        assertTrue(Boolean.TRUE.equals(rejectRes.get("success")), "Test 6: Driver rejects request");
        assertEquals("REJECTED", req3.getStatus(), "Test 6: Request status is REJECTED");
        Ride rideAfterReject = service.getRideById("r_test_101");
        assertEquals(1, rideAfterReject.getAvailableSeats(), "Test 6: Available seats remain 1 after rejection");

        // -------------------------------------------------------------
        // Test 7: Unauthorized Driver Cannot Accept
        // -------------------------------------------------------------
        RideRequest req4 = new RideRequest();
        req4.setId("req_pass_4");
        req4.setRideId("r_test_101");
        req4.setPassengerId("pass_neha");
        req4.setSeatsRequested(1);
        service.createRideRequest(req4);

        Map<String, Object> unauthAccept = service.acceptRideRequest("req_pass_4", "wrong_driver");
        assertTrue(Boolean.FALSE.equals(unauthAccept.get("success")), "Test 7: Wrong driver cannot accept request");
        assertEquals("FORBIDDEN", unauthAccept.get("errorCode"), "Test 7: Error code is FORBIDDEN");

        // -------------------------------------------------------------
        // Test 8: Passenger 1 Cancels Confirmed Booking -> Seat Restored
        // -------------------------------------------------------------
        String bookingId = String.valueOf(bookingData.get("id"));
        Map<String, Object> cancelBookingRes = service.cancelBooking(bookingId, "pass_simran");
        assertTrue(Boolean.TRUE.equals(cancelBookingRes.get("success")), "Test 8: Passenger cancels confirmed booking");
        Ride rideAfterCancel = service.getRideById("r_test_101");
        assertEquals(3, rideAfterCancel.getAvailableSeats(), "Test 8: Seats restored back to 3 after cancellation (1 + 2 = 3)");

        // -------------------------------------------------------------
        // Test 9: Notifications Check
        // -------------------------------------------------------------
        List<Map<String, Object>> driverNotifs = service.getNotificationsByUserId("driver_raj");
        assertTrue(!driverNotifs.isEmpty(), "Test 9: Driver received notifications for requests and cancellations");

        List<Map<String, Object>> passengerNotifs = service.getNotificationsByUserId("pass_simran");
        assertTrue(!passengerNotifs.isEmpty(), "Test 9: Passenger received notification upon acceptance");

        System.out.println("\n=============================================================");
        System.out.println("  TEST RESULTS: " + passed + " PASSED, " + failed + " FAILED");
        System.out.println("=============================================================");

        if (failed > 0) {
            System.exit(1);
        }
    }
}
