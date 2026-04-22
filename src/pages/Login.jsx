import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TipsSection from '../components/TipsSection';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Login - Buried';
    
    // Check if user is already logged in
    if (localStorage.getItem('token')) {
      navigate('/my-secrets');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Custom form validation
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Please enter your email';
    }
    
    if (!password) {
      newErrors.password = 'Please enter your password';
    }
    
    setErrors(newErrors);
    
    // If form is valid, proceed with login
    if (Object.keys(newErrors).length === 0) {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
          throw new Error('Login failed');
        }
        
        const data = await response.json();
        localStorage.setItem('token', data.token);
        navigate('/my-secrets');
      } catch (error) {
        console.error('Login error:', error);
        setErrors({ login: 'Invalid email or password' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="page">
      <Header />
      <main className="main">
        <div className="container">
          <div className="login-form">
            <h2>Login</h2>
            <p>Enter your credentials to access your account:</p>

            <form onSubmit={handleSubmit}>
              {errors.login && <div className="error-message">{errors.login}</div>}
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
              
              <div className="auth-link">
                Don't have an account? <a href="/register">Register here</a>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;