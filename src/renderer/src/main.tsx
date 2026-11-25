import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initAuthFetchInterceptor } from './utils/apiConfig';
import { initMockFetch } from './utils/mockFetch';

// Initialize offline browser database emulator first, then wrap with per-device Bearer token injector & 401 lock
initMockFetch();
initAuthFetchInterceptor();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
