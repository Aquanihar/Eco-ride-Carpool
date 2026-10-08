import { dbGetNotificationsByUserId } from '@/lib/db';
import { getAuthUser, successResponse, errorResponse } from '@/lib/auth';
import { forwardToJavaBackend } from '@/lib/javaBackendBridge';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const javaRes = await forwardToJavaBackend(req, `/api/notifications${queryString ? '?' + queryString : ''}`);
    if (javaRes.forwarded && javaRes.data) {
      return Response.json(javaRes.data, { status: javaRes.status });
    }

    const auth = getAuthUser(req);
    const userId = auth ? auth.id : searchParams.get('userId') || 'u_passenger_demo';

    const notifications = await dbGetNotificationsByUserId(userId);
    return successResponse({ notifications }, 'Notifications retrieved.');
  } catch (err) {
    return errorResponse(err.message, 500, 'SERVER_ERROR');
  }
}
