import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomBar from '../components/BottomBar';
import TipsSection from '../components/TipsSection';
import Icon from '../components/Icon';
import Notification from '../components/Notification';
import { API_BASE_URL, TOC_BASE_URL } from '../config';
import './MySecrets.css';

const MySecrets = () => {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    document.title = 'My Secrets - Buried';
  }, []);
  
  // 监听窗口大小变化，判断是否为移动端
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 监听滚动事件，实现移动端向上拉动翻页
  useEffect(() => {
    const handleScroll = () => {
      if (isMobile && !loading && !isLoadingMore && currentPage < totalPages) {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const clientHeight = document.documentElement.clientHeight || window.innerHeight;
        
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          loadMoreSecrets();
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, loading, isLoadingMore, currentPage, totalPages]);

  const [showExtractCodeInput, setShowExtractCodeInput] = useState(null);
  const [extractCode, setExtractCode] = useState('');
  const [activeSecret, setActiveSecret] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(null);
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const fetchSecrets = async (page = 1, append = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/secret/query?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch secrets');
      }
      
      const data = await response.json();
      
      if (append) {
        setSecrets(prevSecrets => [...prevSecrets, ...data.secrets]);
      } else {
        setSecrets(data.secrets);
      }
      
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching secrets:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreSecrets = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchSecrets(currentPage + 1, true);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSecrets();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setNotification({ message: 'Code copied to clipboard', type: 'success' });
    });
  };

  const [actionType, setActionType] = useState('view'); // 'view' or 'edit'

  const handleViewSecret = (secret) => {
    setActionType('view');
    setActiveSecret(secret);
    setShowExtractCodeInput(secret.id);
    setExtractCode('');
  };

  const handleEditSecret = (secret) => {
    setActionType('edit');
    setActiveSecret(secret);
    setShowExtractCodeInput(secret.id);
    setExtractCode('');
    setShowMoreMenu(null);
  };

  const handleVerifyExtractCode = async (e) => {
    e.preventDefault();
    if (!activeSecret) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Please login first', type: 'error' });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/secret/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ secret_id: activeSecret.id, code: extractCode, mode: actionType })
      });

      if (!response.ok) {
        throw new Error('Invalid extract code');
      }

      const data = await response.json();
      if (data.is_valid) {
        // 根据操作类型进行不同的跳转
        if (actionType === 'view') {
          // 导航到查看秘密的页面
          navigate(`/view-secret?id=${activeSecret.id}&extract_token=${data.extract_token}&extract_code=${encodeURIComponent(extractCode)}`);
        } else if (actionType === 'edit') {
          // 导航到New Secret页面，并传递secret的内容
          navigate(`/new-secret?edit=true&id=${activeSecret.id}&extract_token=${data.extract_token}&extract_code=${encodeURIComponent(extractCode)}&title=${encodeURIComponent(activeSecret.secret_title)}&content=${encodeURIComponent(activeSecret.secret_content || '')}&destruction_method=${activeSecret.destruction_method}&maximum_views=${activeSecret.maximum_views}&destroy_time=${activeSecret.destroy_time || ''}&show_in_secrets_list=${activeSecret.show_in_secrets_list}&enable_decoy_password=${activeSecret.enable_decoy_password}&destroy_on_decoy_access=${activeSecret.destroy_on_decoy_access}&wrong_password_destruction=${activeSecret.wrong_password_destruction || false}&failed_attempts=${activeSecret.failed_attempts || 1}&decoy_content=${encodeURIComponent(activeSecret.decoy_content || '')}`);
        }
        setShowExtractCodeInput(null);
        setActiveSecret(null);
        setExtractCode('');
        setActionType('view');
      } else {
        setNotification({ message: 'Invalid extract code', type: 'error' });
      }
    } catch (error) {
      console.error('Error verifying extract code:', error);
      setNotification({ message: 'Invalid extract code', type: 'error' });
    }
  };

  const handleShareSecret = (secret) => {
    // 构建分享链接
    const shareUrl = `${TOC_BASE_URL}/extract-secret?id=${secret.id}`;
    const shareText = `${secret.secret_title}: ${shareUrl}`;
    
    // 复制到剪贴板
    navigator.clipboard.writeText(shareText).then(() => {
      setNotification({ message: 'Share link copied to clipboard', type: 'success' });
    });
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleDeleteSecret = (secret) => {
    setShowDeleteConfirm(secret);
    setShowMoreMenu(null);
  };

  const confirmDeleteSecret = async () => {
    if (!showDeleteConfirm) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Please login first', type: 'error' });
        setShowDeleteConfirm(null);
        return;
      }

      // 确保secretId是字符串格式
      const secretId = String(showDeleteConfirm.id);
      const response = await fetch(`${API_BASE_URL}/api/v1/secret/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ secret_id: secretId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete secret');
      }

      // 从列表中移除删除的秘密
      setSecrets(secrets.filter(s => s.id !== showDeleteConfirm.id));
      setNotification({ message: 'Secret deleted successfully', type: 'success' });
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting secret:', error);
      setNotification({ message: 'Failed to delete secret', type: 'error' });
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="page">
      <Header />
      <main className="main">
        <div className="container">
          <TipsSection title="Your Secrets are Secure">
            <ul>
              <li>All secrets are encrypted and stored securely. Only you can access them with the extraction code.</li>
              <li>Encrypted storage with no plaintext access</li>
              <li>Automatic destruction based on your settings</li>
              <li>No tracking of who accesses your secrets</li>
              <li>Instant permanent deletion when requested</li>
            </ul>
          </TipsSection>

          <div className="my-secrets">
            <h2>My Secrets</h2>
            <p>Set up a secure secret with custom destruction and access settings:</p>

            <div className="secrets-list">
              {loading ? (
                <p>Loading secrets...</p>
              ) : secrets.length === 0 ? (
                <p>No secrets found. Create your first secret!</p>
              ) : (
                <>
                  {secrets.map((secret) => (
                    <div key={secret.id} className="secret-item">
                      <div className="secret-header">
                        <div className="secret-title-container">
                          <h3 onClick={() => handleViewSecret(secret)} style={{ cursor: 'pointer' }}>
                            {secret.secret_title}
                          </h3>
                          <div className="secret-actions">
                            <button 
                              className="action-btn share-btn"
                              onClick={() => handleShareSecret(secret)}
                              title="Share"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                <polyline points="16 6 12 2 8 6"></polyline>
                                <line x1="12" y1="2" x2="12" y2="15"></line>
                              </svg>
                            </button>
                            <button 
                              className="action-btn more-btn"
                              onClick={() => setShowMoreMenu(showMoreMenu === secret.id ? null : secret.id)}
                              title="More"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="19" cy="12" r="1"></circle>
                                <circle cx="5" cy="12" r="1"></circle>
                              </svg>
                            </button>
                            {showMoreMenu === secret.id && (
                              <div className="more-menu">
                                <button 
                                  className="menu-item"
                                  onClick={() => handleEditSecret(secret)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="menu-item delete"
                                  onClick={() => handleDeleteSecret(secret)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="secret-meta">
                          {secret.destruction_method === 'time' && (
                            <span className="remaining-time">
                              <Icon name="clock" className="meta-icon" /> {secret.destroy_time ? new Date(secret.destroy_time).toLocaleString() : 'Time-based destruction'}
                            </span>
                          )}
                          {secret.destruction_method === 'view' && (
                            <span className="remaining-views">
                              <Icon name="eye" className="meta-icon" /> {secret.remaining_views} views remaining
                            </span>
                          )}
                          <span className="created-date">Created: {new Date(secret.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      {showExtractCodeInput === secret.id && (
                        <div className="extract-code-input">
                          <h4>Enter Extract Code to View Secret</h4>
                          <form onSubmit={handleVerifyExtractCode}>
                            <input
                              type="text"
                              value={extractCode}
                              onChange={(e) => setExtractCode(e.target.value)}
                              placeholder="Enter extract code"
                              required
                            />
                            <div className="form-actions">
                              <button type="submit" className="btn btn-primary">Verify</button>
                              <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => {
                                  setShowExtractCodeInput(null);
                                  setActiveSecret(null);
                                  setExtractCode('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* 移动端加载更多指示器 */}
                  {isMobile && currentPage < totalPages && (
                    <div className="loading-more">
                      {isLoadingMore ? 'Loading more...' : 'Pull up to load more'}
                    </div>
                  )}
                </>
              )}
            </div>
            {/* PC端分页组件 */}
            {!isMobile && total > 0 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  onClick={() => fetchSecrets(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => fetchSecrets(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className="pagination-btn"
                  onClick={() => fetchSecrets(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => fetchSecrets(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </div>
            )}
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
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-dialog">
            <h3>Delete Secret</h3>
            <p>This action will permanently delete the secret and cannot be undone. Continue?</p>
            <div className="delete-confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDeleteSecret}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySecrets;