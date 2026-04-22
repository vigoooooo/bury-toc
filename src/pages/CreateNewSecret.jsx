import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TipsSection from '../components/TipsSection';
import Icon from '../components/Icon';
import Notification from '../components/Notification';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './CreateNewSecret.css';

const CreateNewSecret = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const secretId = searchParams.get('id');
  const extractToken = searchParams.get('extract_token');
  
  // 基本信息
  const [secretTitle, setSecretTitle] = useState('');
  const [secretContent, setSecretContent] = useState('');
  const [extractCode, setExtractCode] = useState('');
  
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
  const hasFetchedRef = useRef(false);
  
  // 在组件加载时，从URL参数中获取值并设置状态
  useEffect(() => {
    if (isEditMode && secretId && extractToken && !hasFetchedRef.current) {
      // 标记已经调用过接口，避免重复调用
      hasFetchedRef.current = true;
      
      // 调用GetSecretForEdit接口获取完整的秘密详情
      const fetchSecretDetails = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setNotification({ message: 'Please login first', type: 'error' });
            return;
          }
          
          const response = await fetch(`http://localhost:8080/api/v1/secret/get-for-edit/${secretId}`, {
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
          
          // 填充表单数据
          if (data.secret) {
            setSecretTitle(data.secret.secret_title || '');
            setSecretContent(data.secret.secret_content || '');
            setExtractCode(data.secret.extract_code || '');
            setDestructionMethod(data.secret.destruction_method || 'view');
            setMaximumViews(data.secret.maximum_views || 10);
            setShowInSecretsList(data.secret.show_in_secrets_list !== false);
            setWrongPasswordDestruction(data.secret.wrong_password_destruction || false);
            setFailedAttempts(data.secret.failed_attempts || 1);
            setEnableDecoyPassword(data.secret.enable_decoy_password || false);
            setDecoyContent(data.secret.decoy_content || '');
            setDecoyPassword(data.secret.decoy_password || '');
            setDestroyOnDecoyAccess(data.secret.destroy_on_decoy_access || false);
            if (data.secret.destroy_time) {
              setDestroyTime(new Date(data.secret.destroy_time));
            }
          }
        } catch (error) {
          console.error('Error fetching secret details:', error);
          setNotification({ message: 'Failed to fetch secret details. Please try again.', type: 'error' });
        }
      };
      
      fetchSecretDetails();
    }
  }, [isEditMode, secretId, extractToken]); // 当这些值变化时重新运行
  
  // 通知状态
  const [notification, setNotification] = useState(null);

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
      
      // 验证当Enable Decoy Password为true时，Decoy Content和Decoy Password都必须填写
      if (enableDecoyPassword) {
        if (!decoyContent) {
          setNotification({ message: 'Decoy Content is required when Enable Decoy Password is true', type: 'error' });
          return;
        }
        if (!decoyPassword) {
          setNotification({ message: 'Decoy Password is required when Enable Decoy Password is true', type: 'error' });
          return;
        }
      }
      
      let response;
      let message;
      
      if (isEditMode && secretId && extractToken) {
        // 编辑模式，调用update接口
        response = await fetch('http://localhost:8080/api/v1/secret/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            secret_id: secretId,
            extract_token: extractToken,
            secret_title: secretTitle,
            secret_content: secretContent,
            extract_code: extractCode,
            destruction_method: destructionMethod,
            maximum_views: maximumViews,
            destroy_time: destroyTime ? destroyTime.toISOString() : null,
            show_in_secrets_list: showInSecretsList,
            wrong_password_destruction: wrongPasswordDestruction,
            failed_attempts: failedAttempts,
            enable_decoy_password: enableDecoyPassword,
            decoy_content: decoyContent,
            decoy_password: decoyPassword,
            destroy_on_decoy_access: destroyOnDecoyAccess
          })
        });
        message = 'Secret updated successfully';
      } else {
        // 创建模式，调用create接口
        response = await fetch('http://localhost:8080/api/v1/secret/new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            secret_title: secretTitle,
            secret_content: secretContent,
            extract_code: extractCode,
            destruction_method: destructionMethod,
            maximum_views: maximumViews,
            destroy_time: destroyTime ? destroyTime.toISOString() : null,
            show_in_secrets_list: showInSecretsList,
            wrong_password_destruction: wrongPasswordDestruction,
            failed_attempts: failedAttempts,
            enable_decoy_password: enableDecoyPassword,
            decoy_content: decoyContent,
            decoy_password: decoyPassword,
            destroy_on_decoy_access: destroyOnDecoyAccess
          })
        });
        message = 'Secret created successfully';
      }
      
      if (!response.ok) {
        // 尝试获取具体的错误信息
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} secret`);
      }
      
      const data = await response.json();
      setNotification({ message: message, type: 'success' });
      console.log(`${isEditMode ? 'Update' : 'Create'} secret response:`, data);
      
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
      
      // 跳转到MySecrets页面
      navigate('/my-secrets');
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
              <li>Your secrets are encrypted and salted before being stored. We never have access to your unencrypted data.</li>
              <li>AES-256 encryption for all secrets - we can't read your secrets</li>
              <li>Zero-knowledge architecture - we don't track access</li>
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
                      placeholder="Enter your secret here"
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
                <button type="button" className="create-secret-btn create-secret-btn-secondary" onClick={() => navigate('/my-secrets')}>{isEditMode ? 'Cancel' : 'Cancel'}</button>
              </div>
            </form>
          </div>
        </div>
      </main>
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