/**
 * 零知识加密工具
 * 
 * 核心设计：
 * - 秘密内容使用提取码 (extractCode) 作为密钥进行 AES-256-GCM 加密
 * - 诱饵内容使用诱饵密码 (decoyPassword) 作为密钥进行 AES-256-GCM 加密
 * - 后端只存储加密后的内容和提取码/诱饵密码的 bcrypt 哈希
 * - 后端永远无法解密秘密内容（零知识架构）
 * 
 * 加密格式：base64(salt[16] + iv[12] + ciphertext)
 */

/**
 * 使用密码加密文本（AES-256-GCM + PBKDF2）
 * @param {string} text - 待加密的明文
 * @param {string} password - 加密密码
 * @returns {Promise<string>} base64 编码的加密数据
 */
export const encrypt = async (text, password) => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(text)
  );
  
  // 组合 salt + iv + 密文
  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(encryptedArray, salt.length + iv.length);
  
  return btoa(String.fromCharCode(...combined));
};

/**
 * 使用密码解密文本（AES-256-GCM + PBKDF2）
 * @param {string} encryptedText - base64 编码的加密数据
 * @param {string} password - 解密密码
 * @returns {Promise<string>} 解密后的明文
 * @throws {Error} 解密失败时抛出错误
 */
export const decrypt = async (encryptedText, password) => {
  const combined = new Uint8Array(
    [...atob(encryptedText)].map(char => char.charCodeAt(0))
  );
  
  if (combined.length < 28) {
    throw new Error('Invalid encrypted data: data too short');
  }
  
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 16 + 12);
  const encrypted = combined.slice(16 + 12);
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
};
