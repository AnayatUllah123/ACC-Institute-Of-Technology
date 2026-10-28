
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export async function api(path, options = {}) {
  let response;

  try {
    response = await fetch(`${BASE}/api${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Cannot reach server. Please check your backend connection.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Request failed (${response.status})`
    );
  }

  return data;
}

export function send(path, method, body) {
  return api(path, {
    method,
    body: JSON.stringify(body),
  });
}
