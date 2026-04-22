import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TipsSection from '../components/TipsSection';
import Notification from '../components/Notification';
import './ViewSecret.css';

const ViewSecret = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [secret, setSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showExtractCodeInput, setShowExtractCodeInput] = useState(false);
  const [extractCode, setExtractCode] = useState('');
  const hasFetched = useRef(false);

  // 从 URL 参数中获取 secret_id 和 extract_token
  const searchParams = new URLSearchParams(location.search);
  const secretId = searchParams.get('id');
  const extractToken = searchParams.get('extract_token');

  useEffect(() => {
    document.title = 'View Secret - Buried';
  }, []);

  useEffect(() => {
    console.log('useEffect triggered');
    console.log('secretId:', secretId);
    console.log('extractToken:', extractToken);
    console.log('hasFetched.current:', hasFetched.current);

    if (hasFetched.current) {
      console.log('Already fetched, skipping');
      return;
    }
    hasFetched.current = true;

    const fetchSecret = async () => {
      if (!secretId) {
        console.log('No secretId');
        setNotification({ message: 'Invalid secret link', type: 'error' });
        setLoading(false);
        return;
      }

      if (!extractToken) {
        console.log('No extractToken');
        // 如果没有 extract_token，显示提取码输入表单
        setShowExtractCodeInput(true);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching secret...');
        const response = await fetch(`http://localhost:8080/api/v1/secret/get/${secretId}`, {
          method: 'GET',
          headers: {
            'X-Extract-Token': extractToken
          }
        });

        console.log('Response status:', response.status);
        if (!response.ok) {
          try {
            const errorData = await response.json();
            console.log('Error data:', errorData);
            if (errorData.error === 'Invalid or expired extract token') {
              // Redirect to extract secret page
              navigate(`/extract-secret?id=${secretId}`);
              return;
            }
            throw new Error(errorData.error || 'Failed to fetch secret');
          } catch (e) {
            throw new Error('Failed to fetch secret');
          }
        }

        const data = await response.json();
        console.log('Secret data:', data);
        setSecret(data.secret);
      } catch (error) {
        console.error('Error fetching secret:', error);
        setNotification({ message: error.message || 'Failed to fetch secret', type: 'error' });
        console.log('Notification set:', { message: error.message || 'Failed to fetch secret', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchSecret();
  }, [secretId, extractToken, navigate]);

  const handleVerifyExtractCode = async (e) => {
    e.preventDefault();
    if (!secretId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Please login first', type: 'error' });
        return;
      }

      const response = await fetch('http://localhost:8080/api/v1/secret/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ secret_id: secretId, code: extractCode })
      });

      if (!response.ok) {
        throw new Error('Invalid extract code');
      }

      const data = await response.json();
      if (data.is_valid) {
        // 重定向到带有 extract_token 的 ViewSecret 页面
        navigate(`/view-secret?id=${secretId}&extract_token=${data.extract_token}`);
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
          <p>We protect your secrets. All secrets in the system is encrypted and securely stored.</p>
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
                <p>{secret.secret_content}</p>
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