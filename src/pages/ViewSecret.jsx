import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TipsSection from '../components/TipsSection';
import Notification from '../components/Notification';
import { API_BASE_URL } from '../config';
import { decrypt } from '../utils/crypto';
import './ViewSecret.css';

const ViewSecret = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [secret, setSecret] = useState(null);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showExtractCodeInput, setShowExtractCodeInput] = useState(false);
  const [extractCode, setExtractCode] = useState('');
  const hasFetched = useRef(false);

  // 从导航 state 获取参数（不再从 URL 参数获取敏感的提取码）
  const locationState = location.state || {};
  const secretId = new URLSearchParams(location.search).get('id') || locationState.secretId;
  const extractToken = locationState.extractToken;
  const extractCodeFromState = locationState.extractCode;
  const isDecoyFromState = locationState.isDecoy;

  useEffect(() => {
    document.title = 'View Secret - Buried';
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchSecret = async () => {
      if (!secretId) {
        setNotification({ message: 'Invalid secret link', type: 'error' });
        setLoading(false);
        return;
      }

      if (!extractToken || !extractCodeFromState) {
        // 没有提取码或 token，需要重新验证
        navigate(`/extract-secret?id=${secretId}`);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/secret/get/${secretId}`, {
          method: 'GET',
          headers: {
            'X-Extract-Token': extractToken
          }
        });

        if (!response.ok) {
          try {
            const errorData = await response.json();
            if (errorData.error === 'Invalid or expired extract token') {
              navigate(`/extract-secret?id=${secretId}`);
              return;
            }
            throw new Error(errorData.error || 'Failed to fetch secret');
          } catch (e) {
            throw new Error('Failed to fetch secret');
          }
        }

        const data = await response.json();
        setSecret(data.secret);
        
        // 使用提取码在本地解密秘密内容（零知识架构）
        if (data.secret && data.secret.secret_content) {
          try {
            const content = await decrypt(data.secret.secret_content, extractCodeFromState);
            setDecryptedContent(content);
          } catch (error) {
            console.error('Decryption error:', error);
            setNotification({ message: 'Failed to decrypt secret. Please check your extract code.', type: 'error' });
          }
        }
      } catch (error) {
        console.error('Error fetching secret:', error);
        setNotification({ message: error.message || 'Failed to fetch secret', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchSecret();
  }, [secretId, extractToken, extractCodeFromState, navigate]);

  const handleVerifyExtractCode = async (e) => {
    e.preventDefault();
    if (!secretId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/secret/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ secret_id: secretId, code: extractCode })
      });

      if (!response.ok) {
        throw new Error('Invalid extract code');
      }

      const data = await response.json();
      if (data.is_valid) {
        // 使用 state 传递提取码和 token（不再放入 URL）
        navigate(`/view-secret?id=${secretId}`, {
          state: {
            secretId,
            extractToken: data.extract_token,
            extractCode: extractCode,
            isDecoy: data.is_decoy
          }
        });
      } else {
        setNotification({ message: 'Invalid extract code', type: 'error' });
      }
    } catch (error) {
      console.error('Error verifying extract code:', error);
      setNotification({ message: 'Invalid extract code', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="view-secret-container">
        <Header showMenu={!!localStorage.getItem('token')} />
        <div className="view-secret-content">
          <div className="loading">Loading secret...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="view-secret-container">
      <Header showMenu={!!localStorage.getItem('token')} />
      <div className="view-secret-content">
        <TipsSection title="Security Notice" expanded={false}>
          <p>We protect your secrets. All secrets are encrypted and securely stored.</p>
          <p>Please do not share this link because token for this url can only be used once.</p>
        </TipsSection>

        {showExtractCodeInput && (
          <div className="extract-code-form">
            <h2>Enter Extract Code</h2>
            <p>Please enter the extraction code to access this secret</p>
            <form onSubmit={handleVerifyExtractCode}>
              <div className="form-group">
                <input
                  type="text"
                  value={extractCode}
                  onChange={(e) => setExtractCode(e.target.value)}
                  placeholder="Enter extract code"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Verify</button>
            </form>
          </div>
        )}

        {secret && (
          <div className="secret-display">
            <h2>Secret Details</h2>
            <div className="secret-info">
              <div className="secret-content">
                <p>{decryptedContent || 'Decrypting...'}</p>
              </div>
            </div>
          </div>
        )}

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ViewSecret;
