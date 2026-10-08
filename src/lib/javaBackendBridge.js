const JAVA_BACKEND_URL = process.env.JAVA_BACKEND_URL || 'http://localhost:8080';

/**
 * Forwards API requests from Next.js route handlers to the Java backend service.
 * If Java backend is reachable, returns the response.
 * If not reachable, returns { forwarded: false } to allow local fallback.
 */
export async function forwardToJavaBackend(req, path, options = {}) {
  try {
    const url = `${JAVA_BACKEND_URL}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    let body = options.body;
    const method = options.method || (req ? req.method : 'GET');

    if (!body && req && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = await req.clone().text();
      } catch (e) {
        body = undefined;
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (req && req.headers) {
      const auth = req.headers.get('authorization');
      if (auth) headers['authorization'] = auth;
    }

    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);
    return {
      forwarded: true,
      status: res.status,
      data,
    };
  } catch (err) {
    return {
      forwarded: false,
      error: err.message,
    };
  }
}
