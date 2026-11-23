/**
 * apiConfig.ts
 * Dynamic API Base URL resolver for Madras Ortho Clinic Pharmacy Software.
 * 
 * Works seamlessly across:
 * 1. Desktop Electron window (file:// protocol -> http://localhost:4848)
 * 2. Localhost Web Browser (http://localhost:4848 -> http://localhost:4848)
 * 3. Mobile / Tablet / Laptop on same Wi-Fi (http://192.168.x.x:4848 -> http://192.168.x.x:4848)
 * 4. Android Capacitor APK (reads localStorage 'moc_clinic_server_url' or falls back to 'http://madrasorthoclinic.local:4848')
 */

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

