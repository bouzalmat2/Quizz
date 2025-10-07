import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userRole, setUserRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    
    // Basic validation
    if (isRegister) {
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters long!');
        setIsLoading(false);
        return;
      }
    }

    // Call backend API
    const url = isRegister ? '/api/register' : '/api/login';
    const payload = isRegister
      ? { name: fullName, email, password, role: userRole }
      : { email, password };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = data?.message || data?.error || 'Authentication failed';
          throw new Error(message);
        }
        return data;
      })
      .then((response) => {
        const userData = response?.data;
        if (!userData) throw new Error('Invalid server response');
        // store token and role
        try { localStorage.setItem('qcm_user_token', userData.api_token); } catch (err) {}
        try { localStorage.setItem('qcm_user_role', userData.role); } catch (err) {}
        setIsLoading(false);
        // redirect
        if (userData.role === 'teacher') {
          navigate('/dashboard/teacher');
        } else {
          navigate('/dashboard/student');
        }
      })
      .catch(err => {
        setIsLoading(false);
        alert(err.message || 'Authentication failed');
      });
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">QCM-Net</div>
          <h1 className="auth-title">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {isRegister 
              ? 'Join QCM-Net to start creating or taking computer networking quizzes' 
              : 'Sign in to your QCM-Net account'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
              {isRegister && (
                <span className="password-requirements">(min. 6 characters)</span>
              )}
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">I am a...</label>
                <div className="role-selection">
                  <div 
                    className={`role-option ${userRole === 'student' ? 'selected' : ''}`}
                    onClick={() => setUserRole('student')}
                  >
                    <span className="role-icon">🎓</span>
                    <div className="role-name">Student</div>
                  </div>
                  <div 
                    className={`role-option ${userRole === 'teacher' ? 'selected' : ''}`}
                    onClick={() => setUserRole('teacher')}
                  >
                    <span className="role-icon">👨‍🏫</span>
                    <div className="role-name">Teacher</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!isRegister && (
            <div className="forgot-password">
              <a href="/forgot-password">Forgot your password?</a>
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="auth-switch">
          <p className="auth-switch-text">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              // Reset form when switching
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setFullName('');
            }}
            className="auth-switch-button"
            type="button"
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}