/**
 * 输入消毒工具
 * 防止 XSS 攻击，清理用户输入中的潜在危险内容
 */

/**
 * 转义 HTML 特殊字符
 * @param {string} str - 待转义的字符串
 * @returns {string} 转义后的安全字符串
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  const htmlEscaper = /[&<>"'\/]/g;
  return str.replace(htmlEscaper, (match) => htmlEscapes[match]);
};

/**
 * 消毒用户输入的文本（用于显示在页面上）
 * 注意：秘密内容不需要消毒，因为它只显示在纯文本区域
 * @param {string} input - 用户输入
 * @returns {string} 消毒后的文本
 */
export const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  return escapeHtml(input.trim());
};

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否合法
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {{ valid: boolean, strength: string, message: string }}
 */
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, strength: 'weak', message: '密码至少需要 6 个字符' };
  }
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 2) {
    return { valid: true, strength: 'weak', message: '密码强度：弱' };
  } else if (score <= 3) {
    return { valid: true, strength: 'medium', message: '密码强度：中' };
  } else {
    return { valid: true, strength: 'strong', message: '密码强度：强' };
  }
};
