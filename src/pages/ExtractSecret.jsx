import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TipsSection from '../components/TipsSection';
import Notification from '../components/Notification';
import { API_BASE_URL } from '../config';
import './ExtractSecret.css';

const ExtractSecret = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [extractionCode, setExtractionCode] = useState('');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  // 从 URL 参数中获取 secret_id
  const searchParams = new URLSearchParams(location.search);
  const secretId = searchParams.get('id');

  useEffect(() => {
    document.title = 'Extract Secret - Buried';
  }, []);

  useEffect(() => {
    // 如果没有 secret_id，提示非法访问并跳转到登录页面
    if (!secretId) {
      setNotification({ message: 'Invalid access', type: 'error' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [secretId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secretId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/secret/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ secret_id: secretId, code: extractionCode })
      });

      if (!response.ok) {
        throw new Error('Invalid extract code');
      }

      const data = await response.json();
      if (data.is_valid) {
        // 重定向到带有 extract_token 和提取码的 ViewSecret 页面
        navigate(`/view-secret?id=${secretId}&extract_token=${data.extract_token}&extract_code=${encodeURIComponent(extractionCode)}`);
      } else {
        setNotification({ message: 'Invalid extract code', type: 'error' });
      }
    } catch (error) {
      console.error('Error verifying extract code:', error);
      setNotification({ message: 'Invalid extract code', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 检查用户是否已登录
  const isLoggedIn = () => {
    return localStorage.getItem('token') !== null;
  };

  return (
    <div className="page">
      <Header showMenu={isLoggedIn()} />
      <main className="main">
        <div className="container">
          <TipsSection title="Secure Secret Extraction">
            <ul>
              <li>Secrets are decrypted only when accessed with the correct code. We never store unencrypted data.</li>
              <li>End-to-end encryption - decrypted only on your device</li>
              <li>No server-side logging of extracted content</li>
              <li>Single-use or limited-view access as configured</li>
              <li>Automatic destruction after conditions are met</li>
            </ul>
          </TipsSection>

          <div className="extract-form">
            <h2>Extract Secret</h2>
            <p>Enter the extraction code to access the secret</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="extraction-code">Extraction Code</label>
                <input
                  type="text"
                  id="extraction-code"
                  value={extractionCode}
                  onChange={(e) => setExtractionCode(e.target.value)}
                  placeholder="Enter the extraction code"
                  required
                />
                <p className="form-hint">The code was provided to you by the secret creator</p>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Extract Secret'}
              </button>
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

export default ExtractSecret;