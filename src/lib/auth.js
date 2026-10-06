import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'raahi-super-secret-jwt-key-2026';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function getAuthUser(req) {
  const authHeader = req.headers.get('authorization') || '';
  let token = null;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Check cookies if needed or custom header
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) return null;
  return verifyToken(token);
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message, status = 400, errorCode = 'BAD_REQUEST') {
  return jsonResponse(
    {
      success: false,
      message,
      errorCode,
    },
    status
  );
}

export function successResponse(data = {}, message = 'Success', status = 200) {
  return jsonResponse(
    {
      success: true,
      message,
      ...data,
    },
    status
  );
}
