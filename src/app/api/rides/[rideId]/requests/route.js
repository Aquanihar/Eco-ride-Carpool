import {
  dbGetRideById,
  dbCreateRideRequest,
  dbGetActiveRideRequest,
  dbGetRequestsByRideId,
  isDeparturePassed,
  dbCreateNotification,
} from '@/lib/db';
import { getAuthUser, successResponse, errorResponse } from '@/lib/auth';
import { forwardToJavaBackend } from '@/lib/javaBackendBridge';

// POST /api/rides/[rideId]/requests -> Passenger sends request
export async function POST(req, { params }) {
  try {
    const { rideId } = await params;

    const javaRes = await forwardToJavaBackend(req, `/api/rides/${rideId}/requests`);
    if (javaRes.forwarded && javaRes.data) {
      return Response.json(javaRes.data, { status: javaRes.status });
    }
    const auth = getAuthUser(req);
    const body = await req.json();

    const passengerId = auth ? auth.id : body.passengerId || 'u_passenger_demo';
    const passengerName = auth ? auth.name : body.passengerName || 'Passenger';
    const passengerRating = auth ? auth.rating : body.passengerRating || 4.9;

    const {
      seatsRequested = 1,
      pickupLocation,
      pickupLatitude,
      pickupLongitude,
      dropLocation,
      dropLatitude,
      dropLongitude,
      message,
    } = body;

    // 1 & 2: Auth and validation
    if (!seatsRequested || seatsRequested < 1) {
      return errorResponse('Invalid seatsRequested.', 400, 'INVALID_SEATS');
    }

    // 3 & 4: Find & verify ride exists
    const ride = await dbGetRideById(rideId);
    if (!ride) {
      return errorResponse('Ride not found.', 404, 'RIDE_NOT_FOUND');
    }

    // 5: Verify ride status is PUBLISHED
    if (ride.status !== 'PUBLISHED') {
      return errorResponse('Ride is not available for request.', 400, 'RIDE_NOT_PUBLISHED');
    }

    // 6: Verify passenger is not the driver
    if (ride.driver_id === passengerId) {
      return errorResponse('Driver cannot request their own ride.', 400, 'CANNOT_REQUEST_OWN_RIDE');
    }

    // 7: Verify departure time has not passed
    if (isDeparturePassed(ride.departure_date, ride.departure_time)) {
      return errorResponse('Ride departure time has already passed.', 400, 'RIDE_EXPIRED');
    }

    // 8 & 9: Verify enough seats are currently available
    if (seatsRequested > ride.available_seats) {
      return errorResponse('Not enough seats available.', 400, 'INSUFFICIENT_SEATS');
    }

    // 10: Check whether passenger already has an active request for this ride
    const existingActiveReq = await dbGetActiveRideRequest(rideId, passengerId);
    if (existingActiveReq) {
      return errorResponse(
        'You already have an active request for this ride.',
        409,
        'DUPLICATE_ACTIVE_REQUEST'
      );
    }

    // 11 & 12: Create RideRequest with status = PENDING
    const request = await dbCreateRideRequest({
      rideId,
      passengerId,
      passengerName,
      passengerRating,
      seatsRequested: Number(seatsRequested),
      pickupLocation,
      pickupLatitude,
      pickupLongitude,
      dropLocation,
      dropLatitude,
      dropLongitude,
      message,
    });

    // 14: Notify the driver
    await dbCreateNotification({
      userId: ride.driver_id,
      type: 'match',
      title: 'New Ride Request 🚗',
      message: `You have a new ride request from ${passengerName} for ${seatsRequested} seat(s).`,
      relatedRideId: rideId,
      relatedRequestId: request.id,
    });

    return successResponse(
      { request },
      'Ride request sent successfully.',
      201
    );
  } catch (err) {
    return errorResponse(err.message, 500, 'SERVER_ERROR');
  }
}

// GET /api/rides/[rideId]/requests -> Driver views incoming requests
export async function GET(req, { params }) {
  try {
    const { rideId } = await params;

    const javaRes = await forwardToJavaBackend(req, `/api/rides/${rideId}/requests`);
    if (javaRes.forwarded && javaRes.data) {
      return Response.json(javaRes.data, { status: javaRes.status });
    }

    const auth = getAuthUser(req);
    const { searchParams } = new URL(req.url);

    const ride = await dbGetRideById(rideId);
    if (!ride) {
      return errorResponse('Ride not found.', 404, 'RIDE_NOT_FOUND');
    }

    // Authorization: Only ride driver can view requests
    const requestingUserId = auth ? auth.id : searchParams.get('driverId');
    const rideDriverId = ride.driver_id || ride.driver?.id;
    if (requestingUserId && rideDriverId && rideDriverId !== requestingUserId) {
      return errorResponse('Unauthorized: Only the driver of this ride can view requests.', 403, 'FORBIDDEN');
    }

    const requests = await dbGetRequestsByRideId(rideId);
    return successResponse({ requests }, 'Incoming ride requests retrieved.');
  } catch (err) {
    return errorResponse(err.message, 500, 'SERVER_ERROR');
  }
}
