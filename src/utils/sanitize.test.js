import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeText, isValidEmail, validatePasswordStrength } from '../utils/sanitize';

describe('sanitize.js - 输入消毒工具', () => {
  describe('escapeHtml', () => {
    it('应转义 HTML 特殊字符', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('应转义 & 符号', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('应转义单引号', () => {
      expect(escapeHtml("it's")).toBe('it&#x27;s');
    });

    it('不应修改安全文本', () => {
      expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
    });

    it('应处理空字符串', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('应处理非字符串输入', () => {
      expect(escapeHtml(null)).toBe(null);
      expect(escapeHtml(undefined)).toBe(undefined);
      expect(escapeHtml(123)).toBe(123);
    });
  });

  describe('sanitizeText', () => {
    it('应去除前后空白并转义 HTML', () => {
      expect(sanitizeText('  <b>hello</b>  ')).toBe('&lt;b&gt;hello&lt;&#x2F;b&gt;');
    });

    it('应处理非字符串输入', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeText(123)).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('应接受合法邮箱', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.org')).toBe(true);
    });

    it('应拒绝非法邮箱', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('应拒绝短密码', () => {
      const result = validatePasswordStrength('12345');
      expect(result.valid).toBe(false);
      expect(result.strength).toBe('weak');
    });

    it('6位纯字母应视为弱密码', () => {
      const result = validatePasswordStrength('abcdef');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('weak');
    });

    it('混合大小写+数字应视为中强密码', () => {
      const result = validatePasswordStrength('Abc123xyZ');
      expect(result.valid).toBe(true);
      expect(['medium', 'strong']).toContain(result.strength);
    });

    it('大小写+数字+特殊字符应视为强密码', () => {
      const result = validatePasswordStrength('MyP@ssw0rd!2024');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('空密码应无效', () => {
      const result = validatePasswordStrength('');
      expect(result.valid).toBe(false);
    });
  });
});
