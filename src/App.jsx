import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ExtractSecret from './pages/ExtractSecret';
import ProfileSettings from './pages/ProfileSettings';
import CreateNewSecret from './pages/CreateNewSecret';
import MySecrets from './pages/MySecrets';
import Login from './pages/Login';
import Register from './pages/Register';
import ViewSecret from './pages/ViewSecret';
import { API_BASE_URL } from './config';

// 认证中间件
const RequireAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // 验证token的有效性
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/user/get`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // token无效，清除本地存储
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/extract-secret" element={<ExtractSecret />} />
        <Route path="/view-secret" element={<ViewSecret />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/my-secrets" />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/new-secret" element={<CreateNewSecret />} />
          <Route path="/my-secrets" element={<MySecrets />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
