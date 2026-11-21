/**
 * apiConfig.ts
 * Dynamic API Base URL resolver for Madras Ortho Clinic Pharmacy Software.
 * 
 * Works seamlessly across:
 * 1. Desktop Electron window (file:// protocol -> http://localhost:4848)
 * 2. Localhost Web Browser (http://localhost:4848 -> http://localhost:4848)
 * 3. Mobile / Tablet / Laptop on same Wi-Fi (http://192.168.x.x:4848 -> http://192.168.x.x:4848)
 * 4. Android Capacitor APK (offline fallback or local mock)
 */

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    // When loaded in a browser over HTTP/HTTPS (localhost or LAN IP like 192.168.x.x)
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      if (window.location.host) {
        return `${window.location.protocol}//${window.location.host}`;
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
