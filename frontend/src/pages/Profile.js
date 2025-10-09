import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const token = localStorage.getItem('qcm_user_token');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, [token, navigate]);

  function fetchUserProfile() {
    setIsLoading(true);
    fetch('/api/profile', { 
      headers: { Authorization: token ? `Bearer ${token}` : '' } 
    })
      .then(r => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then(d => {
        const u = d?.data || {};
        setUser(u);
        setName(u.name || '');
        setAvatarPreview(u.avatar || null);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
        navigate('/auth');
      });
  }

  function handleAvatarChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    
    // Validate file size (max 2MB)
    if (f.size > 2 * 1024 * 1024) {
      showMessage('error', 'Image size must be less than 2MB');
      return;
    }
    
    // Validate file type
    if (!f.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }

    setAvatarFile(f);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(f);
  }

  function saveProfile(e) {
    e.preventDefault();
    setIsLoading(true);
    // If a file is selected, upload it as multipart/form-data (POST endpoint)
    if (avatarFile) {
      const form = new FormData();
      form.append('name', name);
      form.append('avatar', avatarFile);

      fetch('/api/profile', {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        body: form,
      })
        .then(async r => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data?.error || 'Failed to update profile');
          return data;
        })
        .then(d => {
          setUser(prev => ({ ...prev, ...d.data }));
          // ensure preview uses server-provided URL
          if (d.data.avatar) setAvatarPreview(d.data.avatar);
          setAvatarFile(null);
          showMessage('success', 'Profile updated successfully!');
        })
        .catch(err => showMessage('error', err.message))
        .finally(() => setIsLoading(false));
      return;
    }

    // No file: simple PUT for name change
    const payload = { name };
    fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(payload),
    })
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || 'Failed to update profile');
        return data;
      })
      .then(d => {
        setUser(prev => ({ ...prev, ...d.data }));
        showMessage('success', 'Profile updated successfully!');
      })
      .catch(err => showMessage('error', err.message))
      .finally(() => setIsLoading(false));
  }

  function changePassword(e) {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    setIsLoading(true);

    fetch('/api/profile/password', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: token ? `Bearer ${token}` : '' 
      },
      body: JSON.stringify({ 
        old_password: oldPassword, 
        new_password: newPassword 
      }),
    })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || data?.message || 'Failed to change password');
        return data;
      })
      .then(() => {
        showMessage('success', 'Password changed successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch(err => {
        showMessage('error', err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    setToast({ message: text, type: type === 'error' ? 'error' : 'info' });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }

  function getInitials(name) {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  }

  if (isLoading && !user) {
    return (
      <div className="profile-container">
        <div className="card">
          <div className="loading-state">
            <div className="loading-spinner large"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="profile-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Account Settings</h2>
          <p className="card-subtitle">Manage your profile and security settings</p>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile Information
          </button>
          <button
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security & Password
          </button>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content">
            <form onSubmit={saveProfile} className="profile-form">
              <div className="avatar-section">
                <div className="avatar-upload">
                  <div className="avatar-preview">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Profile avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        {getInitials(user?.name || user?.email)}
                      </div>
                    )}
                  </div>
                  <div className="avatar-actions">
                    <label className="btn btn-outline btn-sm">
                      <span>📷</span>
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="file-input"
                      />
                    </label>
                    {avatarPreview && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-danger"
                        onClick={() => {
                          setAvatarPreview(null);
                          setAvatarFile(null);
                        }}
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={user?.email || ''}
                    readOnly
                    disabled
                  />
                  <div className="form-hint">Email cannot be changed</div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <div className="role-display">
                  <span className={`role-badge role-${user?.role}`}>
                    {user?.role || 'user'}
                  </span>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="tab-content">
            <form onSubmit={changePassword} className="security-form">
              <div className="form-group">
                <label className="form-label">
                  Current Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  required
                  minLength="6"
                />
                <div className="form-hint">
                  Password must be at least 6 characters long
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Confirm New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <div className="form-error">Passwords do not match</div>
                )}
                {newPassword && confirmPassword && newPassword === confirmPassword && (
                  <div className="form-success">Passwords match</div>
                )}
              </div>

              <div className="password-strength">
                <div className="strength-label">Password Strength:</div>
                <div className="strength-bar">
                  <div 
                    className={`strength-fill ${
                      newPassword.length < 6 ? 'weak' :
                      newPassword.length < 10 ? 'medium' : 'strong'
                    }`}
                    style={{
                      width: `${
                        newPassword.length < 6 ? '33' :
                        newPassword.length < 10 ? '66' : '100'
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !oldPassword || !newPassword || !confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <span>🔒</span>
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="security-tips">
              <h4>🔐 Security Tips</h4>
              <ul>
                <li>Use a unique password that you don't use elsewhere</li>
                <li>Include numbers, symbols, and both uppercase and lowercase letters</li>
                <li>Consider using a password manager</li>
                <li>Never share your password with anyone</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
    <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </>
  );
}