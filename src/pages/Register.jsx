import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TipsSection from '../components/TipsSection';
import './Register.css';

const Register = () => {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Register - Buried';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Custom form validation
    const newErrors = {};
    
    if (!nickname) {
      newErrors.nickname = 'Please enter your nickname';
    }
    
    if (!email) {
      newErrors.email = 'Please enter your email';
    }
    
    if (!password) {
      newErrors.password = 'Please enter your password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    
    // If form is valid, proceed with registration
    if (Object.keys(newErrors).length === 0) {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/v1/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nickname, email, password })
        });
        
        if (!response.ok) {
          throw new Error('Registration failed');
        }
        
        const data = await response.json();
        localStorage.setItem('token', data.token);
        navigate('/my-secrets');
      } catch (error) {
        console.error('Registration error:', error);
        setErrors({ register: 'Registration failed. Please try again.' });
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
          <TipsSection title="Create an Account">
            <ul>
              <li>Your information is encrypted and stored securely.</li>
              <li>We never share your personal data with third parties.</li>
              <li>Create a strong password to protect your account.</li>
              <li>You can manage your account settings at any time.</li>
            </ul>
          </TipsSection>

          <div className="register-form">
            <h2>Register</h2>
            <p>Create an account to start using our secret sharing service:</p>

            <form onSubmit={handleSubmit}>
              {errors.register && <div className="error-message">{errors.register}</div>}
              
              <div className="form-group">
                <label htmlFor="nickname">Nickname</label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  required
                />
                {errors.nickname && <span className="error-message">{errors.nickname}</span>}
              </div>
              
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
              
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </div>
              
              <div className="auth-link">
                Already have an account? <a href="/login">Login here</a>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;