import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../utils/crypto';

describe('crypto.js - 零知识加密工具', () => {
  describe('encrypt + decrypt 往返测试', () => {
    it('应正确加解密普通文本', async () => {
      const plaintext = 'Hello, World!';
      const password = 'my-secret-code';
      
      const encrypted = await encrypt(plaintext, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(plaintext);
    });

    it('应正确加解密中文内容', async () => {
      const plaintext = '这是一个秘密信息 🔑';
      const password = '提取码123';
      
      const encrypted = await encrypt(plaintext, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(plaintext);
    });

    it('应正确加解密长文本', async () => {
      const plaintext = 'A'.repeat(10000);
      const password = 'password';
      
      const encrypted = await encrypt(plaintext, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(plaintext);
    });

    it('应正确加解密空字符串', async () => {
      const plaintext = '';
      const password = 'password';
      
      const encrypted = await encrypt(plaintext, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(plaintext);
    });

    it('应正确加解密包含特殊字符的文本', async () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;\':",./<>?\n\t\r\\';
      const password = 'special!chars#password';
      
      const encrypted = await encrypt(plaintext, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('加密安全性验证', () => {
    it('相同内容和密码应生成不同的密文（随机 salt+iv）', async () => {
      const plaintext = 'same content';
      const password = 'same password';
      
      const encrypted1 = await encrypt(plaintext, password);
      const encrypted2 = await encrypt(plaintext, password);
      
      // 由于 salt 和 iv 是随机的，密文应该不同
      expect(encrypted1).not.toBe(encrypted2);
      
      // 但两者都应能正确解密
      const decrypted1 = await decrypt(encrypted1, password);
      const decrypted2 = await decrypt(encrypted2, password);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it('错误的密码应导致解密失败', async () => {
      const plaintext = 'secret message';
      const password = 'correct-password';
      const wrongPassword = 'wrong-password';
      
      const encrypted = await encrypt(plaintext, password);
      
      await expect(decrypt(encrypted, wrongPassword)).rejects.toThrow();
    });

    it('密文应是 base64 编码', async () => {
      const encrypted = await encrypt('test', 'password');
      
      // base64 字符集只包含 A-Z, a-z, 0-9, +, /, =
      expect(/^[A-Za-z0-9+/=]+$/.test(encrypted)).toBe(true);
    });

    it('篡改密文应导致解密失败', async () => {
      const plaintext = 'important secret';
      const password = 'password';
      
      const encrypted = await encrypt(plaintext, password);
      
      // 篡改密文（修改最后几个字符）
      const tampered = encrypted.slice(0, -4) + 'XXXX';
      
      await expect(decrypt(tampered, password)).rejects.toThrow();
    });
  });

  describe('边界情况', () => {
    it('短密码应正常工作', async () => {
      const plaintext = 'secret';
      const password = 'a';
      
      const encrypted = await encrypt(plaintext, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(plaintext);
    });

    it('长密码应正常工作', async () => {
      const plaintext = 'secret';
      const password = 'A'.repeat(1000);
      
      const encrypted = await encrypt(plaintext, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(plaintext);
    });

    it('无效的加密数据应抛出错误', async () => {
      await expect(decrypt('invalid-base64!!!', 'password')).rejects.toThrow();
    });

    it('太短的加密数据应抛出错误', async () => {
      // base64 编码但数据太短
      const short = btoa('abc');
      await expect(decrypt(short, 'password')).rejects.toThrow();
    });
  });
});
