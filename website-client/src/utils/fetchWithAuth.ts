import { store } from '@/store/store';
import { logout, setAccessToken } from '@/store/authSlice';

async function refreshTokens(): Promise<string> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Refresh token request failed');
    }
    
    const contentType = res.headers.get('content-type');
    let accessToken: string;
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      accessToken = data.access_token;
    } else {
      accessToken = await res.text();
    }
    
    store.dispatch(setAccessToken(accessToken));
    return accessToken;
  } catch (err) {
    console.error('[refreshTokens] error:', err);
    store.dispatch(logout());
    throw err;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export async function fetchWithAuth(
  url: RequestInfo,
  options: RequestInit = {}
): Promise<Response> {
  let { accessToken } = store.getState().auth;
  
  if (!accessToken) {
    try {
      accessToken = await refreshTokens();
    } catch (err) {
      console.error('[fetchWithAuth] token refresh failed:', err);
    }
  }

  const headers = new Headers(options.headers || {});

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const method = options.method ? options.method.toUpperCase() : 'GET';
  if (method === 'GET') {
    headers.set('Accept', 'application/json');
  } else if (!(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err) {
    console.error('[fetchWithAuth] fetch error:', err);
    throw err;
  }

  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshTokens()
        .catch(() => '')
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
    }

    const newAccessToken = await refreshPromise;
    if (!newAccessToken) {
      return response;
    }

    const retryHeaders = new Headers(fetchOptions.headers);
    retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);

    const retryOptions: RequestInit = {
      ...fetchOptions,
      headers: retryHeaders,
    };

    try {
      response = await fetch(url, retryOptions);
    } catch (err) {
      console.error('[fetchWithAuth] retry fetch error:', err);
      throw err;
    }
  }

  return response;
}
