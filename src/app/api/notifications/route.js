import { dbGetNotificationsByUserId } from '@/lib/db';
import { getAuthUser, successResponse, errorResponse } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    const { searchParams } = new URL(req.url);

    const userId = auth ? auth.id : searchParams.get('userId') || 'u_passenger_demo';

    const notifications = await dbGetNotificationsByUserId(userId);
    return successResponse({ notifications }, 'Notifications retrieved.');
  } catch (err) {
    return errorResponse(err.message, 500, 'SERVER_ERROR');
  }
}
