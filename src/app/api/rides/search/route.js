import { dbSearchRides } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/auth';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
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

    return successResponse({ rides }, 'Search results retrieved.');
  } catch (err) {
    return errorResponse(err.message, 500, 'SERVER_ERROR');
  }
}
