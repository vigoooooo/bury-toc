import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomBar from '../components/BottomBar';
import TipsSection from '../components/TipsSection';
import Icon from '../components/Icon';
import Notification from '../components/Notification';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { API_BASE_URL } from '../config';
import { encrypt, decrypt } from '../utils/crypto';
import './CreateNewSecret.css';

const CreateNewSecret = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 从导航 state 获取编辑模式参数（不再从 URL 参数获取敏感信息）
  const locationState = location.state || {};
  const isEditMode = locationState.edit === true;
  const secretId = locationState.secretId;
  const extractToken = locationState.extractToken;
  const extractCodeFromState = locationState.extractCode;
  const decoyPasswordFromState = locationState.decoyPassword;
  
  // 基本信息
  const [secretTitle, setSecretTitle] = useState('');
  const [secretContent, setSecretContent] = useState('');
  const [extractCode, setExtractCode] = useState(extractCodeFromState || '');
  
  // 增强设置
  const [destructionMethod, setDestructionMethod] = useState('view');
  const [maximumViews, setMaximumViews] = useState(10);
  const [destroyTime, setDestroyTime] = useState(null);
  const [showInSecretsList, setShowInSecretsList] = useState(true);
  const [wrongPasswordDestruction, setWrongPasswordDestruction] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(1);
  
  // 特殊设置
  const [enableDecoyPassword, setEnableDecoyPassword] = useState(false);
  const [decoyContent, setDecoyContent] = useState('');
  const [decoyPassword, setDecoyPassword] = useState('');
  const [destroyOnDecoyAccess, setDestroyOnDecoyAccess] = useState(false);
  // 编辑模式下是否有诱饵密码可解密诱饵内容
  const [hasDecoyPasswordForEdit, setHasDecoyPasswordForEdit] = useState(false);
  const hasFetchedRef = useRef(false);
  
  // 通知状态
  const [notification, setNotification] = useState(null);

  // 在编辑模式下，从后端获取加密内容并使用提取码在本地解密
  // 使用 key 追踪编辑请求，防止 state 残留导致误触发
  const editRequestKey = isEditMode && secretId && extractToken ? `${secretId}-${extractToken}` : null;
  const lastEditKeyRef = useRef(null);

  useEffect(() => {
    if (extractCodeFromState) {
      setExtractCode(extractCodeFromState);
    }

    // 非编辑模式：重置为新建模式
    if (!isEditMode) {
      lastEditKeyRef.current = null;
      setSecretTitle('');
      setSecretContent('');
      setExtractCode('');
      setDestructionMethod('view');
      setMaximumViews(10);
      setDestroyTime(null);
      setShowInSecretsList(true);
      setWrongPasswordDestruction(false);
      setFailedAttempts(1);
      setEnableDecoyPassword(false);
      setDecoyContent('');
      setDecoyPassword('');
      setDestroyOnDecoyAccess(false);
      setHasDecoyPasswordForEdit(false);
      return;
    }

    // 编辑模式：确保只请求一次，且跳过已处理过的同一编辑请求
    if (!secretId || !extractToken) return;
    if (lastEditKeyRef.current === editRequestKey) return;
    lastEditKeyRef.current = editRequestKey;

    const fetchSecretDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setNotification({ message: 'Please login first', type: 'error' });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/secret/get-for-edit/${secretId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Extract-Token': extractToken
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch secret details for edit');
        }

        const data = await response.json();

        if (data.secret) {
          setSecretTitle(data.secret.secret_title || '');
          setDestructionMethod(data.secret.destruction_method || 'view');
          setMaximumViews(data.secret.maximum_views || 10);
          setShowInSecretsList(data.secret.secret_show_in_list !== false);
          setWrongPasswordDestruction(data.secret.wrong_password_destruction || false);
          setFailedAttempts(data.secret.failed_attempts || 1);
          setEnableDecoyPassword(data.secret.enable_decoy_password || false);
          setDestroyOnDecoyAccess(data.secret.destroy_on_decoy_access || false);
          if (data.secret.destroy_time) {
            setDestroyTime(new Date(data.secret.destroy_time));
          }

          // 使用提取码在本地解密秘密内容（零知识架构）
          if (data.secret.secret_content && extractCodeFromState) {
            try {
              const decryptedContent = await decrypt(data.secret.secret_content, extractCodeFromState);
              setSecretContent(decryptedContent);
            } catch (error) {
              console.error('Error decrypting secret content:', error);
              setNotification({ message: 'Failed to decrypt secret content. Please check your extract code.', type: 'error' });
            }
          }

          // 使用诱饵密码解密诱饵内容（如果提供了诱饵密码）
          if (data.secret.enable_decoy_password && data.secret.decoy_content) {
            if (decoyPasswordFromState) {
              try {
                const decryptedDecoyContent = await decrypt(data.secret.decoy_content, decoyPasswordFromState);
                setDecoyContent(decryptedDecoyContent);
                setDecoyPassword(decoyPasswordFromState);
                setHasDecoyPasswordForEdit(true);
              } catch (error) {
                console.error('Error decrypting decoy content:', error);
                setDecoyContent('');
                setDecoyPassword('');
                setHasDecoyPasswordForEdit(false);
              }
            } else {
              setDecoyContent('');
              setDecoyPassword('');
              setHasDecoyPasswordForEdit(false);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching secret details:', error);
        setNotification({ message: 'Failed to fetch secret details. Please try again.', type: 'error' });
      }
    };

    fetchSecretDetails();
  }, [isEditMode, secretId, extractToken, extractCodeFromState, editRequestKey]);

  // 只在组件挂载时设置一次标题
  useEffect(() => {
    document.title = isEditMode ? 'Edit Secret - Buried' : 'Create New Secret - Buried';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Please login first', type: 'error' });
        return;
      }
      
      // 验证诱饵密码设置
      if (enableDecoyPassword) {
        // 编辑模式下没有诱饵密码时，不需要验证 decoyContent 和 decoyPassword
        if (isEditMode && !hasDecoyPasswordForEdit) {
          // 跳过验证，诱饵内容保持不变
        } else {
          if (!decoyContent) {
            setNotification({ message: 'Decoy Content is required when Enable Decoy Password is true', type: 'error' });
            return;
          }
          if (!decoyPassword) {
            setNotification({ message: 'Decoy Password is required when Enable Decoy Password is true', type: 'error' });
            return;
          }
        }
      }
      
      // 零知识架构：使用提取码在客户端加密秘密内容
      const encryptedContent = await encrypt(secretContent, extractCode);
      
      // 使用诱饵密码在客户端加密诱饵内容
      let encryptedDecoyContent = '';
      // 编辑模式下没有诱饵密码时，不加密诱饵内容（保持不变）
      const decoyUnchanged = isEditMode && enableDecoyPassword && !hasDecoyPasswordForEdit;
      if (enableDecoyPassword && decoyContent && decoyPassword && !decoyUnchanged) {
        encryptedDecoyContent = await encrypt(decoyContent, decoyPassword);
      }
      
      // 发送到后端的数据：
      // - secret_content: 客户端加密后的内容（后端无法解密）
      // - extract_code: 明文（后端用 bcrypt 哈希后存储，不可逆）
      // - decoy_password: 明文（同上）
      // - decoy_content: 客户端加密后的内容（后端无法解密）
      
      let response;
      let message;
      
      if (isEditMode && secretId && extractToken) {
        // 编辑模式
        response = await fetch(`${API_BASE_URL}/api/v1/secret/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            secret_id: secretId,
            extract_token: extractToken,
            secret_title: secretTitle,
            secret_content: encryptedContent,
            extract_code: extractCode,
            destruction_method: destructionMethod,
            maximum_views: maximumViews,
            destroy_time: destroyTime ? destroyTime.toISOString() : null,
            show_in_secrets_list: showInSecretsList,
            wrong_password_destruction: wrongPasswordDestruction,
            failed_attempts: failedAttempts,
            enable_decoy_password: enableDecoyPassword,
            decoy_content: decoyUnchanged ? '' : encryptedDecoyContent,
            decoy_password: decoyUnchanged ? '' : decoyPassword,
            decoy_unchanged: decoyUnchanged,
            destroy_on_decoy_access: destroyOnDecoyAccess
          })
        });
        message = 'Secret updated successfully';
      } else {
        // 创建模式
        response = await fetch(`${API_BASE_URL}/api/v1/secret/new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            secret_title: secretTitle,
            secret_content: encryptedContent,
            extract_code: extractCode,
            destruction_method: destructionMethod,
            maximum_views: maximumViews,
            destroy_time: destroyTime ? destroyTime.toISOString() : null,
            show_in_secrets_list: showInSecretsList,
            wrong_password_destruction: wrongPasswordDestruction,
            failed_attempts: failedAttempts,
            enable_decoy_password: enableDecoyPassword,
            decoy_content: encryptedDecoyContent,
            decoy_password: decoyPassword,
            destroy_on_decoy_access: destroyOnDecoyAccess
          })
        });
        message = 'Secret created successfully';
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} secret`);
      }
      
      const data = await response.json();
      setNotification({ message: message, type: 'success' });
      
      // 重置表单
      setSecretTitle('');
      setSecretContent('');
      setExtractCode('');
      setDestructionMethod('view');
      setMaximumViews(10);
      setDestroyTime(null);
      setShowInSecretsList(true);
      setWrongPasswordDestruction(false);
      setFailedAttempts(1);
      setEnableDecoyPassword(false);
      setDecoyContent('');
      setDecoyPassword('');
      setDestroyOnDecoyAccess(false);
      
      // 跳转到MySecrets页面，清除 state 避免回退时残留编辑参数
      navigate('/my-secrets', { replace: true, state: {} });
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} secret:`, error);
      setNotification({ message: `Failed to ${isEditMode ? 'update' : 'create'} secret. Please try again.`, type: 'error' });
    }
  };

  return (
    <div className="create-secret-page">
      <Header />
      <main className="create-secret-main">
        <div className="create-secret-container">
          <TipsSection title="How We Protect Your Secrets">
            <ul>
              <li>Your secrets are encrypted on your device before being stored. We never have access to your unencrypted data.</li>
              <li>AES-256 encryption - we can't read your secrets</li>
              <li>Zero-knowledge architecture - server only stores hashes</li>
              <li>Automatic destruction based on your chosen settings</li>
              <li>No logs of secret content or access patterns</li>
            </ul>
          </TipsSection>

          <div className="create-secret-form">
            <h2>{isEditMode ? 'Edit Secret' : 'Create New Secret'}</h2>
            <p>{isEditMode ? 'Update your secret with custom destruction and access settings:' : 'Set up a secure secret with custom destruction and access settings:'}</p>

            <form onSubmit={handleSubmit}>
              <div className="create-secret-settings-section">
                <h3>Basic Information</h3>
                <div className="create-secret-form-group">
                  <label htmlFor="secret-title">Secret Title</label>
                  <input
                      type="text"
                      id="secret-title"
                      value={secretTitle}
                      onChange={(e) => setSecretTitle(e.target.value)}
                      placeholder="Give your secret a memorable name"
                      required
                      onInvalid={(e) => e.target.setCustomValidity('Secret Title is required')}
                      onInput={(e) => e.target.setCustomValidity('')}
                    />
                </div>
                <div className="create-secret-form-group">
                  <label htmlFor="secret-content">Secret Content</label>
                  <textarea
                      id="secret-content"
                      value={secretContent}
                      onChange={(e) => setSecretContent(e.target.value)}
                      placeholder="Enter your secret here"
                      rows={4}
                      required
                      onInvalid={(e) => e.target.setCustomValidity('Secret Content is required')}
                      onInput={(e) => e.target.setCustomValidity('')}
                    />
                </div>
                <div className="create-secret-form-group">
                  <label htmlFor="extract-code">Extract Code</label>
                  <input
                      type="text"
                      id="extract-code"
                      value={extractCode}
                      onChange={(e) => setExtractCode(e.target.value)}
                      placeholder="Enter a code to protect your secret"
                      required
                      onInvalid={(e) => e.target.setCustomValidity('Extract Code is required')}
                      onInput={(e) => e.target.setCustomValidity('')}
                    />
                  <p className="create-secret-form-hint">Required to access this secret: keep it secret! Even yourself can't access secret without extract code!</p>
                </div>
              </div>

              <div className="create-secret-settings-section">
                <h3>Enhanced Settings</h3>
                <div className="create-secret-form-group">
                  <label htmlFor="destruction-method">Destruction Method</label>
                  <select
                    id="destruction-method"
                    value={destructionMethod}
                    onChange={(e) => setDestructionMethod(e.target.value)}
                    className="create-secret-destruction-method-select"
                  >
                    <option value="view">View</option>
                    <option value="time">Time</option>
                    <option value="no-limit">No Limit</option>
                  </select>
                </div>
                {destructionMethod === 'view' && (
                  <div className="create-secret-form-group">
                    <label htmlFor="maximum-views">Maximum Views</label>
                    <input
                      type="number"
                      id="maximum-views"
                      value={maximumViews}
                      onChange={(e) => setMaximumViews(Number(e.target.value))}
                      min="1"
                    />
                  </div>
                )}
                {destructionMethod === 'time' && (
                  <div className="create-secret-form-group">
                    <label htmlFor="destroy-time">Destroy Time</label>
                    <DatePicker
                      id="destroy-time"
                      selected={destroyTime}
                      onChange={(date) => setDestroyTime(date)}
                      showTimeSelect
                      timeFormat="HH:mm:ss"
                      timeIntervals={1}
                      dateFormat="yyyy/MM/dd HH:mm:ss"
                      required
                      className="create-secret-datetime-input"
                    />
                  </div>
                )}
                <div className="create-secret-form-group create-secret-toggle-group">
                  <label htmlFor="show-in-list">Show in my secrets list</label>
                  <div className="create-secret-toggle">
                    <input
                      type="checkbox"
                      id="show-in-list"
                      checked={showInSecretsList}
                      onChange={(e) => setShowInSecretsList(e.target.checked)}
                    />
                    <span className="create-secret-toggle-slider"></span>
                  </div>
                </div>
                <div className="create-secret-form-group create-secret-toggle-group">
                  <label htmlFor="wrong-password-destruction">
                    <Icon name="warning" className="create-secret-warning-icon" /> Wrong Password Destruction
                  </label>
                  <div className="create-secret-toggle">
                    <input
                      type="checkbox"
                      id="wrong-password-destruction"
                      checked={wrongPasswordDestruction}
                      onChange={(e) => setWrongPasswordDestruction(e.target.checked)}
                    />
                    <span className="create-secret-toggle-slider"></span>
                  </div>
                </div>
                {wrongPasswordDestruction && (
                  <div className="create-secret-form-group">
                    <label htmlFor="failed-attempts">Failed Attempts Before Destruction</label>
                    <input
                      type="number"
                      id="failed-attempts"
                      value={failedAttempts}
                      onChange={(e) => setFailedAttempts(Number(e.target.value))}
                      min="1"
                    />
                  </div>
                )}
              </div>

              <div className="create-secret-settings-section">
                <h3>
                  <Icon name="warning" className="create-secret-warning-icon" /> Special Settings (Decoy)
                </h3>
                <p>Create a decoy password that shows different content</p>
                {isEditMode && enableDecoyPassword && !hasDecoyPasswordForEdit && (
                  <p className="create-secret-form-hint" style={{ color: '#e67e22' }}>
                    Decoy content is protected by zero-knowledge encryption. To edit decoy content, please re-enter from My Secrets with the decoy password.
                  </p>
                )}
                <div className="create-secret-form-group create-secret-toggle-group">
                  <label htmlFor="enable-decoy">Enable Decoy Password</label>
                  <div className="create-secret-toggle">
                    <input
                      type="checkbox"
                      id="enable-decoy"
                      checked={enableDecoyPassword}
                      onChange={(e) => setEnableDecoyPassword(e.target.checked)}
                    />
                    <span className="create-secret-toggle-slider"></span>
                  </div>
                </div>
                {enableDecoyPassword && (
                  <>
                    {/* 编辑模式下没有诱饵密码时，隐藏诱饵内容/密码输入框 */}
                    {!(isEditMode && !hasDecoyPasswordForEdit) && (
                      <>
                        <div className="create-secret-form-group">
                          <label htmlFor="decoy-content">Decoy Content</label>
                          <textarea
                            id="decoy-content"
                            value={decoyContent}
                            onChange={(e) => setDecoyContent(e.target.value)}
                            placeholder="Enter your decoy content here"
                            rows={3}
                          />
                        </div>
                        <div className="create-secret-form-group">
                          <label htmlFor="decoy-password">Decoy Password</label>
                          <input
                            type="text"
                            id="decoy-password"
                            value={decoyPassword}
                            onChange={(e) => setDecoyPassword(e.target.value)}
                            placeholder="Enter your decoy password here"
                          />
                          <p className="create-secret-form-hint">Different from the extraction code</p>
                        </div>
                      </>
                    )}
                    <div className="create-secret-form-group create-secret-toggle-group">
                      <label htmlFor="destroy-on-decoy">Destroy Secret On Decoy Access</label>
                      <div className="create-secret-toggle">
                        <input
                          type="checkbox"
                          id="destroy-on-decoy"
                          checked={destroyOnDecoyAccess}
                          onChange={(e) => setDestroyOnDecoyAccess(e.target.checked)}
                        />
                        <span className="create-secret-toggle-slider"></span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="create-secret-form-actions">
                <button type="submit" className="create-secret-btn create-secret-btn-primary">{isEditMode ? 'Update Secret' : 'Create Secret'}</button>
                <button type="button" className="create-secret-btn create-secret-btn-secondary" onClick={() => navigate('/my-secrets')}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <BottomBar />
      <Footer />
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default CreateNewSecret;
