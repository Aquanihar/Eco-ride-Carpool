import { dbRejectRideRequest } from '@/lib/db';
import { getAuthUser, successResponse, errorResponse } from '@/lib/auth';
import { forwardToJavaBackend } from '@/lib/javaBackendBridge';

export async function POST(req, { params }) {
  try {
    const { requestId } = await params;

    const javaRes = await forwardToJavaBackend(req, `/api/ride-requests/${requestId}/reject`);
    if (javaRes.forwarded && javaRes.data) {
      return Response.json(javaRes.data, { status: javaRes.status });
    }

    const auth = getAuthUser(req);
    const body = await req.json().catch(() => ({}));

    const driverId = auth ? auth.id : body.driverId;
    if (!driverId) {
      return errorResponse('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const result = await dbRejectRideRequest(requestId, driverId);

    if (!result.success) {
      return errorResponse(result.message, result.status || 400, result.errorCode);
    }

    return successResponse(result.data, result.message);
  } catch (err) {
    return errorResponse(err.message, 500, 'SERVER_ERROR');
  }
}
