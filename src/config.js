// Vite 构建时会将 import.meta.env.VITE_* 直接替换为常量
// 确保在 .env.production / .env.test 中配置正确的地址
export const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL || 'http://localhost:8080';
export const TOC_BASE_URL = import.meta.env.VITE_REACT_APP_TOC_BASE_URL || 'http://localhost:5173';
export const WEB_BASE_URL = import.meta.env.VITE_REACT_APP_WEB_BASE_URL || 'http://localhost:5173';
