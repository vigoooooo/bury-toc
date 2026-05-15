import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomBar from '../components/BottomBar';
import TipsSection from '../components/TipsSection';
import Notification from '../components/Notification';
import { API_BASE_URL } from '../config';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteSecretsConfirm, setShowDeleteSecretsConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [notification, setNotification] = useState(null);
  const hasFetched = useRef(false);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/user/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  useEffect(() => {
    document.title = 'Profile Settings - Buried';
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/v1/user/get`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const data = await response.json();
        setNickname(data.user.nickname);
        setEmail(data.user.email);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Please login first', type: 'error' });
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/user/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nickname, email })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update personal information');
      }
      
      setNotification({ message: 'Personal information updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error updating personal information:', error);
      setNotification({ message: 'Failed to update personal information. Please try again.', type: 'error' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Please login first', type: 'error' });
        return;
      }
      
      // 验证密码确认
      if (newPassword !== confirmPassword) {
        setNotification({ message: 'New password and confirm password do not match', type: 'error' });
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/user/reset_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          old_password: currentPassword, 
          new_password: newPassword 
        })
      });
      
      console.log('Reset password response status:', response.status);
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.log('Reset password error data:', errorData);
          throw new Error(errorData.message || 'Failed to update password');
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
          throw new Error('Failed to update password. Please try again.');
        }
      }
      
      setNotification({ message: 'Password updated successfully', type: 'success' });
      // 重置表单
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      setNotification({ message: error.message || 'Failed to update password. Please try again.', type: 'error' });
    }
  };

  const handleDeleteSecrets = () => {
    setShowDeleteSecretsConfirm(true);
  };

  const handleConfirmDeleteSecrets = async () => {
    setShowDeleteSecretsConfirm(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Please login first', type: 'error' });
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/secret/delete_all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete secrets');
      }
      
      setNotification({ message: 'All secrets deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting secrets:', error);
      setNotification({ message: 'Failed to delete secrets. Please try again.', type: 'error' });
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountConfirm(true);
  };

  const handleConfirmDeleteAccount = async () => {
    setShowDeleteAccountConfirm(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Please login first', type: 'error' });
        return;
      }
      
      // 检查用户是否有秘密
      const secretsResponse = await fetch(`${API_BASE_URL}/api/v1/secret/query`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!secretsResponse.ok) {
        throw new Error('Failed to check secrets');
      }
      
      const secretsData = await secretsResponse.json();
      if (secretsData.secrets && secretsData.secrets.length > 0) {
        setNotification({ message: 'Please delete all your secrets before deleting your account', type: 'error' });
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/user/delete_account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      setNotification({ message: 'Account deleted successfully', type: 'success' });
      // 清除本地存储并跳转到官网首页
      localStorage.removeItem('token');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Error deleting account:', error);
      setNotification({ message: 'Failed to delete account. Please try again.', type: 'error' });
    }
  };

  return (
    <div className="page">
      <Header />
      <main className="main">
        <div className="container">
          <TipsSection title="Your Data Privacy">
            <ul>
              <li>We only store essential information needed for account management. All data is encrypted and never shared.</li>
              <li>No tracking or analytics on your usage patterns</li>
              <li>Minimal data collection - only what's necessary</li>
              <li>Your profile is never shared with third parties</li>
              <li>Full account deletion available at any time</li>
            </ul>
          </TipsSection>

          <div className="profile-settings">
            <h2>Profile Settings</h2>
            <p>Manage your personal information and account settings</p>

            {loading ? (
              <p>Loading profile information...</p>
            ) : (
              <div className="settings-card">
                <h3>Personal Information</h3>
                <form onSubmit={handlePersonalInfoSubmit}>
                  <div className="form-group">
                    <label htmlFor="nickname">Nick Name</label>
                    <input
                      type="text"
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="form-hint">Once changed, login username also change</p>
                  </div>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </form>
              </div>
            )}

            <div className="settings-card">
              <h3>Change Password</h3>
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="current-password">Current Password</label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-secondary">Update Password</button>
              </form>
            </div>

            <div className="settings-card danger-zone">
              <h3>Danger Zone</h3>
              <div className="danger-item">
                <div>
                  <h4>Delete All Secrets</h4>
                  <p>Permanently delete all your secrets. This action cannot be undone.</p>
                </div>
                <button className="btn btn-danger" onClick={handleDeleteSecrets}>Delete Secrets</button>
              </div>
              <div className="danger-item">
                <div>
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all associated data.</p>
                </div>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>Delete Account</button>
              </div>
            </div>

            <div className="settings-card logout-section">
              <button className="btn btn-logout" onClick={handleLogout}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      <BottomBar />
      <Footer />

      {/* Delete Secrets Confirm Dialog */}
      {showDeleteSecretsConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Delete All Secrets</h3>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to delete all your secrets? This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowDeleteSecretsConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn modal-btn-danger"
                onClick={handleConfirmDeleteSecrets}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirm Dialog */}
      {showDeleteAccountConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Delete Account</h3>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowDeleteAccountConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn modal-btn-danger"
                onClick={handleConfirmDeleteAccount}
              >
                Delete Account
              </button>
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
  );
};

export default ProfileSettings;