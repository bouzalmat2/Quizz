import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = ({ user, onLogout }) => {
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
    // redirect to landing
    navigate('/');
  };

  // Sample data
  const stats = {
    quizzesTaken: 8,
    averageScore: 82,
    improvement: '+12%',
    rank: '15/45'
  };

  const availableQuizzes = [
    { id: 1, title: 'TCP/IP Protocols', subject: 'Networking', duration: '45m', difficulty: 'Medium', dueDate: '2024-02-15' },
    { id: 2, title: 'Network Security', subject: 'Security', duration: '60m', difficulty: 'Hard', dueDate: '2024-02-20' },
    { id: 3, title: 'Wireless Networks', subject: 'Networking', duration: '30m', difficulty: 'Easy', dueDate: '2024-02-25' }
  ];

  const quizHistory = [
    { id: 1, title: 'Network Fundamentals', score: 85, total: 100, date: '2024-01-15', time: '38m' },
    { id: 2, title: 'Routing Protocols', score: 78, total: 100, date: '2024-01-22', time: '42m' },
    { id: 3, title: 'Network Layers', score: 92, total: 100, date: '2024-01-30', time: '35m' }
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
              <div className="user-avatar">{profile ? (profile.name || 'S').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'S'}</div>
            )}
            <div className="user-details">
              <h3>{profile?.name || 'Student'}</h3>
              <p>{profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Student'}</p>
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#overview" className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <span className="nav-icon">📊</span>
            Overview
          </a>
          <a href="#quizzes" className={`nav-item ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>
            <span className="nav-icon">📝</span>
            Available QCMs
          </a>
          <a href="#history" className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <span className="nav-icon">📚</span>
            My Results
          </a>
          <a href="#progress" className={`nav-item ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>
            <span className="nav-icon">📈</span>
            Progress
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
          <h1 className="dashboard-title">Student Dashboard</h1>
          <p className="dashboard-subtitle">Track your progress in computer networking quizzes</p>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3 className="stat-value">{stats.quizzesTaken}</h3>
                <p className="stat-label">Quizzes Taken</p>
              </div>
              <div className="stat-card success">
                <h3 className="stat-value">{stats.averageScore}%</h3>
                <p className="stat-label">Average Score</p>
              </div>
              <div className="stat-card warning">
                <h3 className="stat-value">{stats.improvement}</h3>
                <p className="stat-label">Improvement</p>
              </div>
              <div className="stat-card danger">
                <h3 className="stat-value">{stats.rank}</h3>
                <p className="stat-label">Class Rank</p>
              </div>
            </div>

            <div className="content-grid">
              {/* Available Quizzes */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Available QCMs</h3>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate('/qcms/student')}>View All</button>
                </div>
                <div className="quiz-grid">
                  {availableQuizzes.map(quiz => (
                    <div key={quiz.id} className="quiz-card">
                      <div className="quiz-header">
                        <h4 className="quiz-title">{quiz.title}</h4>
                        <div className="quiz-meta">
                          <span>{quiz.subject}</span>
                          <span>{quiz.duration}</span>
                          <span className={`badge ${
                            quiz.difficulty === 'Easy' ? 'badge-success' : 
                            quiz.difficulty === 'Medium' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {quiz.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="quiz-body">
                        <p><strong>Due:</strong> {quiz.dueDate}</p>
                        <div className="quiz-actions">
                          <button className="btn btn-primary btn-sm" onClick={() => navigate('/qcms/student')}>Start Quiz</button>
                          <button className="btn btn-outline btn-sm" onClick={() => navigate('/qcms/student')}>View Details</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Results */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recent Results</h3>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Quiz</th>
                      <th>Score</th>
                      <th>Date</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizHistory.map(quiz => (
                      <tr key={quiz.id}>
                        <td>{quiz.title}</td>
                        <td>
                          <strong>{quiz.score}/{quiz.total}</strong>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${(quiz.score/quiz.total)*100}%` }}></div>
                          </div>
                        </td>
                        <td>{quiz.date}</td>
                        <td>{quiz.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Available Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">All Available QCMs</h3>
              </div>
              <div className="quiz-grid">
                {availableQuizzes.map(quiz => (
                  <div key={quiz.id} className="quiz-card">
                    <div className="quiz-header">
                      <h4 className="quiz-title">{quiz.title}</h4>
                      <div className="quiz-meta">
                        <span>{quiz.subject}</span>
                        <span>{quiz.duration}</span>
                        <span className={`badge ${
                          quiz.difficulty === 'Easy' ? 'badge-success' : 
                          quiz.difficulty === 'Medium' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {quiz.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="quiz-body">
                      <p><strong>Due Date:</strong> {quiz.dueDate}</p>
                      <p><strong>Instructions:</strong> Complete all questions within the time limit.</p>
                      <div className="quiz-actions">
                        <button className="btn btn-primary" onClick={() => navigate('/qcms/student')}>Start Quiz</button>
                        <button className="btn btn-outline" onClick={() => navigate('/qcms/student')}>View Details</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Learning Progress</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h4>Performance by Topic</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Network Fundamentals</span>
                      <span>85%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>TCP/IP Protocols</span>
                      <span>78%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Network Security</span>
                      <span>65%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;