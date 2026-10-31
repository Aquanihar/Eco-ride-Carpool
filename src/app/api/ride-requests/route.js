import { dbGetRequestsByPassengerId, dbGetRideById } from '@/lib/db';
import { getAuthUser, successResponse, errorResponse } from '@/lib/auth';
import { forwardToJavaBackend } from '@/lib/javaBackendBridge';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const javaRes = await forwardToJavaBackend(req, `/api/ride-requests${queryString ? '?' + queryString : ''}`);
    if (javaRes.forwarded && javaRes.data) {
      return Response.json(javaRes.data, { status: javaRes.status });
    }

    const auth = getAuthUser(req);
    const passengerId = searchParams.get('passengerId') || (auth ? auth.id : null);

    if (!passengerId) {
      return errorResponse('passengerId parameter is required.', 400, 'VALIDATION_ERROR');
    }

    const rawRequests = await dbGetRequestsByPassengerId(passengerId);
    
    // Enrich with ride origin/destination info
    const requests = await Promise.all(
      rawRequests.map(async (r) => {
        const ride = await dbGetRideById(r.ride_id);
        return {
          ...r,
          rideOrigin: ride ? (ride.origin || ride.from?.name) : '',
          rideDestination: ride ? (ride.destination || ride.to?.name) : '',
          rideDate: ride ? (ride.departure_date || ride.date) : '',
          rideTime: ride ? (ride.departure_time || ride.time) : '',
          ridePrice: ride ? (ride.price_per_seat || ride.price) : 0,
          rideDriverName: ride ? (ride.driver?.name || ride.driverName) : '',
        };
      })
    );

    return successResponse({ requests }, 'Passenger requests retrieved.');
  } catch (err) {
    return errorResponse(err.message, 500, 'SERVER_ERROR');
  }
}
