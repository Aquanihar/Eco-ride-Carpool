import { dbCreateRide, dbSearchRides } from '@/lib/db';
import { getAuthUser, successResponse, errorResponse } from '@/lib/auth';
import { forwardToJavaBackend } from '@/lib/javaBackendBridge';

export async function POST(req) {
  try {
    const javaRes = await forwardToJavaBackend(req, '/api/rides');
    if (javaRes.forwarded && javaRes.data) {
      return Response.json(javaRes.data, { status: javaRes.status });
    }
    const auth = getAuthUser(req);
    const body = await req.json();

    const {
      origin,
      destination,
      departureDate,
      departureTime,
      totalSeats,
      pricePerSeat,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
      waypoints,
    } = body;

    if (!origin || !destination || !departureDate || !departureTime || !totalSeats || !pricePerSeat) {
      return errorResponse('Missing required fields.', 400, 'VALIDATION_ERROR');
    }

    const driverId = auth ? auth.id : body.driverId || 'u_driver_default';
    const driverName = auth ? auth.name : body.driverName || 'Verified Driver';

    const ride = await dbCreateRide({
      driverId,
      driverName,
      origin,
      destination,
      departureDate,
      departureTime,
      totalSeats: Number(totalSeats),
      pricePerSeat: Number(pricePerSeat),
      vehicleModel,
      vehicleColor,
      vehiclePlate,
      waypoints,
      status: 'PUBLISHED',
    });

    return successResponse({ ride }, 'Ride created successfully.', 201);
  } catch (err) {
    return errorResponse(err.message, 500, 'SERVER_ERROR');
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const javaRes = await forwardToJavaBackend(req, `/api/rides${queryString ? '?' + queryString : ''}`);
    if (javaRes.forwarded && javaRes.data) {
      return Response.json(javaRes.data, { status: javaRes.status });
    }

    const origin = searchParams.get('origin') || '';
    const destination = searchParams.get('destination') || '';
    const date = searchParams.get('date') || '';
    const passengerCount = Number(searchParams.get('passengerCount') || 1);

    const rides = await dbSearchRides({
      origin,
      destination,
      date,
      passengerCount,
    });

    return successResponse({ rides }, 'Rides retrieved successfully.');
  } catch (err) {
    return errorResponse(err.message, 500, 'SERVER_ERROR');
  }
}
