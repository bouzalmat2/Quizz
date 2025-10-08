import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const token = localStorage.getItem('qcm_user_token');

  useEffect(() => {
    if (!token) return;
    fetch('/api/profile', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then(r => r.json())
      .then(d => setProfile(d?.data || null))
      .catch(() => setProfile(null));
  }, [token]);

  const handleLogout = () => {
    try { localStorage.removeItem('qcm_user_token'); } catch (e) {}
    try { localStorage.removeItem('qcm_user_role'); } catch (e) {}
    if (typeof onLogout === 'function') onLogout();
    navigate('/');
  };

  // Sample data
  const stats = {
    totalQuizzes: 12,
    activeQuizzes: 3,
    totalStudents: 45,
    avgScore: 78
  };

  const recentQuizzes = [
    { id: 1, title: 'TCP/IP Protocols', subject: 'Networking', students: 45, avgScore: 82, status: 'active' },
    { id: 2, title: 'Network Security', subject: 'Security', students: 42, avgScore: 75, status: 'completed' },
    { id: 3, title: 'Routing Algorithms', subject: 'Networking', students: 38, avgScore: 68, status: 'completed' }
  ];

  const studentResults = [
    { id: 1, name: 'John Doe', quiz: 'TCP/IP Protocols', score: 85, total: 100, time: '45m' },
    { id: 2, name: 'Jane Smith', quiz: 'TCP/IP Protocols', score: 92, total: 100, time: '38m' },
    { id: 3, name: 'Mike Johnson', quiz: 'Network Security', score: 78, total: 100, time: '52m' }
  ];

  return (
    <div className="dashboard">
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <a href="/" className="sidebar-logo">QCM-Net</a>
          <div className="user-info" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            {profile?.avatar ? (
              <img src={profile.avatar} alt="avatar" className="user-avatar" />
            ) : (
              <div className="user-avatar">{profile ? (profile.name || 'T').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'T'}</div>
            )}
            <div className="user-details">
              <h3>{profile?.name || 'Teacher'}</h3>
              <p>{profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Teacher'}</p>
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#overview" className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <span className="nav-icon">📊</span>
            Overview
          </a>
          <a href="#create" className={`nav-item ${activeTab === 'create' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigate('/qcms/teacher'); }}>
            <span className="nav-icon">➕</span>
            Create QCM
          </a>
          <a href="#questions" className={`nav-item ${activeTab === 'questions' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigate('/bank/questions'); }}>
            <span className="nav-icon">📚</span>
            Question Bank
          </a>
          <a href="#results" className={`nav-item ${activeTab === 'results' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigate('/qcms/teacher'); }}>
            <span className="nav-icon">🎯</span>
            Student Results
          </a>
          <a href="#analytics" className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <span className="nav-icon">📈</span>
            Analytics
          </a>
          <a href="/profile" className="nav-item">
            <span className="nav-icon">👤</span>
            Profile
          </a>
          <button type="button" onClick={handleLogout} className="nav-item nav-button">
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Teacher Dashboard</h1>
          <p className="dashboard-subtitle">Manage your computer networking quizzes and track student progress</p>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3 className="stat-value">{stats.totalQuizzes}</h3>
                <p className="stat-label">Total QCMs</p>
              </div>
              <div className="stat-card success">
                <h3 className="stat-value">{stats.activeQuizzes}</h3>
                <p className="stat-label">Active QCMs</p>
              </div>
              <div className="stat-card warning">
                <h3 className="stat-value">{stats.totalStudents}</h3>
                <p className="stat-label">Total Students</p>
              </div>
              <div className="stat-card danger">
                <h3 className="stat-value">{stats.avgScore}%</h3>
                <p className="stat-label">Average Score</p>
              </div>
            </div>

            <div className="content-grid">
              {/* Recent Quizzes */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recent QCMs</h3>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate('/qcms/teacher')}>View All</button>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Students</th>
                      <th>Avg Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentQuizzes.map(quiz => (
                      <tr key={quiz.id}>
                        <td>{quiz.title}</td>
                        <td>{quiz.subject}</td>
                        <td>{quiz.students}</td>
                        <td>{quiz.avgScore}%</td>
                        <td>
                          <span className={`badge ${quiz.status === 'active' ? 'badge-success' : 'badge-info'}`}>
                            {quiz.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Quick Actions</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button className="btn btn-primary btn-icon" onClick={() => navigate('/qcms/teacher')}>
                    <span>➕</span> Create New QCM
                  </button>
                  <button className="btn btn-outline btn-icon" onClick={() => navigate('/bank/questions')}>
                    <span>📚</span> Manage Question Bank
                  </button>
                  <button className="btn btn-outline btn-icon" onClick={() => navigate('/qcms/teacher')}>
                    <span>🎯</span> View Student Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create QCM Tab */}
        {activeTab === 'create' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Create New QCM</h3>
            </div>
            <form>
              <div className="form-group">
                <label className="form-label">QCM Title</label>
                <input type="text" className="form-input" placeholder="Enter quiz title" />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select">
                  <option>Computer Networks</option>
                  <option>Network Security</option>
                  <option>TCP/IP Protocols</option>
                  <option>Wireless Networks</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Describe the quiz content"></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input type="number" className="form-input" placeholder="60" />
              </div>
              <button type="submit" className="btn btn-primary">Create QCM</button>
            </form>
          </div>
        )}

        {/* Student Results Tab */}
        {activeTab === 'results' && (
          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Student Results</h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>QCM</th>
                    <th>Score</th>
                    <th>Time Taken</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResults.map(result => (
                    <tr key={result.id}>
                      <td>{result.name}</td>
                      <td>{result.quiz}</td>
                      <td>
                        <strong>{result.score}/{result.total}</strong>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${(result.score/result.total)*100}%` }}></div>
                        </div>
                      </td>
                      <td>{result.time}</td>
                      <td>
                        <button className="btn btn-outline btn-sm">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;