export const isApp = () => {
  if (window.location.href.indexOf('capacitor://') === 0) {
    return true;
  }
  
  if (window.location.protocol === 'capacitor:') {
    return true;
  }
  
  if (typeof window.Capacitor !== 'undefined') {
    if (typeof window.Capacitor.isNativePlatform === 'function') {
      return window.Capacitor.isNativePlatform();
    } else if (window.Capacitor.platform) {
      return true;
    }
    return true;
  }
  
  if (navigator.userAgent && navigator.userAgent.includes('Capacitor')) {
    return true;
  }
  
  if (navigator.userAgent && (navigator.userAgent.includes('iOS') || navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad'))) {
    if (!navigator.userAgent.includes('Safari') || navigator.userAgent.includes('WKWebView') || navigator.userAgent.includes('UIWebView')) {
      return true;
    }
  }
  
  return false;
};

export const checkIsAppSync = () => {
  return isApp();
};