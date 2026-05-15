const isCapacitor = () => {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'capacitor:') return true;
    if (window.Capacitor) return true;
    if (navigator.userAgent && navigator.userAgent.includes('Capacitor')) return true;
  }
  return false;
};

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;
  if (envUrl) return envUrl;
  
  if (isCapacitor()) {
    return 'http://127.0.0.1:8080';
  }
  
  return 'http://localhost:8080';
};

const getTocBaseUrl = () => {
  const envUrl = import.meta.env.VITE_REACT_APP_TOC_BASE_URL;
  if (envUrl) return envUrl;
  
  if (isCapacitor()) {
    return 'http://127.0.0.1:5173';
  }
  
  return 'http://localhost:5173';
};

const getWebBaseUrl = () => {
  const envUrl = import.meta.env.VITE_REACT_APP_WEB_BASE_URL;
  if (envUrl) return envUrl;
  
  if (isCapacitor()) {
    return 'http://127.0.0.1:5173';
  }
  
  return 'http://localhost:5173';
};

export const API_BASE_URL = getApiBaseUrl();
export const TOC_BASE_URL = getTocBaseUrl();
export const WEB_BASE_URL = getWebBaseUrl();
