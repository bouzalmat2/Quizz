import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

const TeacherDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const token = localStorage.getItem('qcm_user_token');
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Dynamic states
  const [qcms, setQcms] = useState([]);
  const [results, setResults] = useState([]); // aggregated attempts across qcms
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('/api/profile', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then(r => r.json())
      .then(d => setProfile(d?.data || null))
      .catch(() => setProfile(null));
    // load qcms and their results
    loadQcmsAndResults();
  }, [token]);

  function loadQcmsAndResults() {
    if (!token) return;
    setLoading(true);
    fetch('/api/qcms', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then(r => r.json())
      .then(async data => {
        const list = data?.data || data || [];
        setQcms(list);

        // For each qcm, use embedded results if present, otherwise fetch
        const promises = list.map(q => {
          if (Array.isArray(q.results)) return Promise.resolve(q.results.map(rr => ({ ...rr, qcm: q })));
          return fetch(`/api/results/qcm/${q.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
            .then(r2 => r2.json())
            .then(d2 => (d2?.data || d2 || []).map(rr => ({ ...rr, qcm: q })))
            .catch(() => []);
        });

        const arrs = await Promise.all(promises);
        const all = arrs.flat();
        setResults(all);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  const handleLogout = () => {
    setConfirmLogout(true);
  };

  const doLogout = () => {
    try { localStorage.removeItem('qcm_user_token'); } catch (e) {}
    try { localStorage.removeItem('qcm_user_role'); } catch (e) {}
    if (typeof onLogout === 'function') onLogout();
    navigate('/');
  };

  // computed stats from fetched qcms/results
  const totalQcms = qcms.length;
  const activeQcms = qcms.filter(q => q.published).length;
  const uniqueStudents = new Set(results.map(r => r.student_id)).size;
  const overallAvg = results.length ? Math.round((results.reduce((s, r) => s + (r.score || 0), 0) / results.length)) : 0;

  const stats = {
    totalQuizzes: totalQcms,
    activeQuizzes: activeQcms,
    totalStudents: uniqueStudents,
    avgScore: overallAvg
  };

  // recent published/created qcms
  const recentQuizzes = [...qcms]
    .sort((a, b) => (new Date(b.created_at || b.updated_at || 0)) - (new Date(a.created_at || a.updated_at || 0)))
    .slice(0, 5)
    .map(q => ({ id: q.id, title: q.title, subject: q.subject || '—', students: (q.results || results.filter(r => r.qcm?.id === q.id)).length, avgScore: (() => {
      const arr = (q.results || results.filter(r => r.qcm?.id === q.id));
      if (!arr.length) return 0;
      const avg = arr.reduce((s, r) => s + (r.score || 0), 0) / arr.length;
      return Math.round(avg);
    })(), status: q.published ? 'active' : 'draft' }));

  const studentResults = [...results]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 8)
    .map(r => ({ id: r.id, name: r.student?.name || r.student_name || `#${r.student_id}`, quiz: r.qcm?.title || `QCM ${r.qcm_id}`, score: Math.round(r.score || 0), total: 100, time: r.duration ? `${Math.round(r.duration/60)}m` : '-' }));

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
          <div className="sidebar-logo" role="banner">QCM-Net</div>
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
                  <button className="btn btn-outline btn-sm QQQ" onClick={() => navigate('/qcms/teacher', { state: { tab: 'qcms' } })}>View All</button>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Submissions</th>
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
                  <button className="btn btn-primary btn-icon" onClick={() => navigate('/qcms/teacher', { state: { tab: 'create' } })}>
                    <span>➕</span> Create New QCM
                  </button>
                  <button className="btn btn-outline btn-icon" onClick={() => navigate('/bank/questions')}>
                    <span>📚</span> Manage Question Bank
                  </button>
                  <button className="btn btn-outline btn-icon" onClick={() => navigate('/qcms/teacher', { state: { tab: 'results' } })}>
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
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/qcms/teacher`)}>View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal 
        open={confirmLogout}
        title="Logout"
        message="Are you sure you want to log out?"
        onConfirm={() => { setConfirmLogout(false); doLogout(); }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
};

export default TeacherDashboard;