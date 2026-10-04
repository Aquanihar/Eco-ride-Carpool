import { dbCancelPendingRequest } from '@/lib/db';
import { getAuthUser, successResponse, errorResponse } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const { requestId } = await params;
    const auth = getAuthUser(req);
    const body = await req.json().catch(() => ({}));

    const passengerId = auth ? auth.id : body.passengerId;
    if (!passengerId) {
      return errorResponse('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const result = await dbCancelPendingRequest(requestId, passengerId);

    if (!result.success) {
      return errorResponse(result.message, result.status || 400, result.errorCode);
    }

    return successResponse(result.data, result.message);
  } catch (err) {
    return errorResponse(err.message, 500, 'SERVER_ERROR');
  }
}
