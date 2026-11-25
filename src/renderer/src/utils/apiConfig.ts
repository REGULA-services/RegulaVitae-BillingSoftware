/**
 * apiConfig.ts
 * Dynamic API Base URL resolver & per-session auth token manager
 * for Madras Ortho Clinic Pharmacy Software.
 *
 * Security Invariant:
 * - Auth session tokens are stored strictly in JavaScript memory (`activeAuthToken`),
 *   NEVER in localStorage — guaranteeing every device, browser tab, ?view=mobile preview,
 *   and restart encounters the Login screen independently without inheriting another session.
 */

let activeAuthToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let authInterceptorInstalled = false;

export const setAuthToken = (token: string | null): void => {
  activeAuthToken = token && token.trim() ? token.trim() : null;
};

export const getAuthToken = (): string | null => activeAuthToken;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

export const getSavedClinicServerUrl = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('moc_clinic_server_url');
    if (saved && saved.trim().length > 0) {
      return saved.trim().replace(/\/+$/, '');
    }
  }
  return '';
};

export const setSavedClinicServerUrl = (url: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const clean = (url || '').trim().replace(/\/+$/, '');
    if (clean) {
      window.localStorage.setItem('moc_clinic_server_url', clean);
    } else {
      window.localStorage.removeItem('moc_clinic_server_url');
    }
  }
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // 1. Explicit user-configured Clinic Server URL (takes highest precedence on mobile/tablet)
    const saved = getSavedClinicServerUrl();
    if (saved) {
      return saved;
    }

    if (window.location) {
      const isCapacitor = !!(window as any).Capacitor ||
        window.location.protocol === 'capacitor:' ||
        (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443'));

      // 2. If running inside native Android Capacitor APK, connect to zero-config clinic domain
      if (isCapacitor) {
        return 'http://madrasorthoclinic.local:4848';
      }

      // 3. When loaded in a browser over HTTP/HTTPS (LAN IP or domain or localhost:4848)
      if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        if (window.location.host) {
          return `${window.location.protocol}//${window.location.host}`;
        }
      }
    }
  }
  // Default fallback for Electron desktop (file://) or server-side
  return 'http://localhost:4848';
};

export const API_BASE = getApiBaseUrl();

export const apiUrl = (endpoint: string): string => {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
};

/**
 * Append session token query parameter for browser URLs that cannot pass Bearer headers
 * (e.g., SSE EventSource streams and window.open Excel/PDF exports).
 */
export const authApiUrl = (endpoint: string): string => {
  const url = apiUrl(endpoint);
  if (!activeAuthToken) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(activeAuthToken)}`;
};

/**
 * Installs a global fetch wrapper (before mockFetch) that attaches
 * `Authorization: Bearer <token>` on all /api/ calls and forces lock-screen
 * redirect on HTTP 401 Unauthorized responses.
 */
export function initAuthFetchInterceptor(): void {
  if (authInterceptorInstalled || typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }
  authInterceptorInstalled = true;
  const baseFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
    const isApiCall = /\/api(\/|$|\?)/i.test(urlStr);

    let finalInit = init;
    if (isApiCall && activeAuthToken) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${activeAuthToken}`);
      }
      finalInit = { ...(init || {}), headers };
    }

    const res = await baseFetch(input as any, finalInit);

    const isAuthEndpoint = /\/api\/auth\/(login|logout)/i.test(urlStr);
    if (isApiCall && !isAuthEndpoint && res.status === 401 && activeAuthToken) {
      activeAuthToken = null;
      if (unauthorizedHandler) {
        try {
          unauthorizedHandler();
        } catch {}
      }
    }

    return res;
  };
}

/**
 * Resilient fetch wrapper with exponential backoff retry.
 * Handles transient network dropouts when mobile/tablet devices move across clinic Wi-Fi zones.
 */
export const fetchWithRetry = async (
  endpoint: string,
  options?: RequestInit,
  retries: number = 2,
  backoffMs: number = 500
): Promise<Response> => {
  const url = apiUrl(endpoint);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
    }
  }
  return fetch(url, options);
};
