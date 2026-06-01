import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 检测 iOS / Capacitor 环境，添加 body class 用于针对性样式（如隐藏滚动条）
const isIOSApp = () => {
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('capacitor') ||
    ua.includes('wkwv') ||
    (window.Capacitor !== undefined) ||
    /iphone|ipad|ipod/.test(ua)
  );
};

if (isIOSApp()) {
  document.body.classList.add('ios-app');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
