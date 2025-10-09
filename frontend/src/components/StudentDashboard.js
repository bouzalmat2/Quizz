import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

const StudentDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [qcms, setQcms] = useState([]);
  const [history, setHistory] = useState([]);

  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const token = localStorage.getItem('qcm_user_token');
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('/api/profile', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then(r => r.json())
      .then(d => setProfile(d?.data || null))
      .catch(() => setProfile(null));

    // load published qcms
    fetch('/api/qcms', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then(r => r.json())
      .then(d => {
        const list = (d?.data || d || []).filter(q => q.published);
        setQcms(list);
      })
      .catch(() => setQcms([]));

    // load student history
    const userId = localStorage.getItem('qcm_user_id');
    if (userId) {
      fetch(`/api/results/student/${userId}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
        .then(r => r.json())
        .then(d => setHistory(d.data || d || []))
        .catch(() => setHistory([]));
    }
  }, [token]);

  // --- Dynamic progress calculations ---
  // Group attempts by qcm_id
  const attemptsByQcm = history.reduce((acc, h) => {
    const id = h.qcm_id || h.qcmId || h.qcm?.id;
    if (!id) return acc;
    if (!acc[id]) acc[id] = [];
    acc[id].push(h);
    return acc;
  }, {});

  // Number of unique quizzes taken
  const quizzesTaken = Object.keys(attemptsByQcm).length;

  // Best score per qcm (use max attempt score per qcm)
  const bestScores = Object.values(attemptsByQcm).map(atts => Math.max(...atts.map(a => a.score || 0)));
  const averageScore = bestScores.length ? Math.round(bestScores.reduce((s, v) => s + v, 0) / bestScores.length) : 0;

  // Improvement: compare average of earlier half vs later half of attempts (chronological)
  let improvement = '—';
  if (history.length >= 2) {
    const sortedAttempts = [...history].slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const mid = Math.floor(sortedAttempts.length / 2);
    const first = sortedAttempts.slice(0, mid);
    const second = sortedAttempts.slice(mid);
    const avg = arr => (arr.length ? arr.reduce((s, x) => s + (x.score || 0), 0) / arr.length : 0);
    const firstAvg = avg(first);
    const secondAvg = avg(second);
    if (firstAvg > 0) {
      const delta = Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
      improvement = (delta >= 0 ? '+' : '') + `${delta}%`;
    } else if (secondAvg > 0) {
      improvement = '+100%';
    }
  }

  // Performance by topic (subject) — average of best per qcm grouped by subject
  const subjectName = (s) => {
    if (!s) return '';
    if (typeof s === 'object') return s.name || '';
    return s;
  };

  const perfByTopic = Object.entries(attemptsByQcm).reduce((acc, [qcmId, atts]) => {
    const q = qcms.find(x => x.id === (typeof qcmId === 'string' ? parseInt(qcmId, 10) : qcmId)) || {};
    const subject = subjectName(q.subject) || 'General';
    const best = Math.max(...atts.map(a => a.score || 0));
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(best);
    return acc;
  }, {});

  const performanceByTopic = Object.entries(perfByTopic).map(([subject, arr]) => ({
    subject,
    average: Math.round(arr.reduce((s, v) => s + v, 0) / (arr.length || 1)),
    total: arr.length,
  }));

  // Performance by difficulty — use attempt.feedback if available
  const difficultyAcc = history.reduce((acc, attempt) => {
    const fb = attempt.feedback || [];
    fb.forEach(f => {
      const d = f.difficulty || 'unknown';
      if (!acc[d]) acc[d] = { total: 0, correct: 0 };
      acc[d].total++;
      if (f.correct) acc[d].correct++;
    });
    return acc;
  }, {});

  const performanceByDifficulty = Object.entries(difficultyAcc).map(([difficulty, obj]) => ({
    difficulty,
    total: obj.total,
    correct: obj.correct,
    percent: obj.total ? Math.round((obj.correct / obj.total) * 100) : 0,
  }));

  // --- Overview statistics requested ---
  // total taken (number of attempts)
  const totalTaken = history.length;

  // overall average percentage across attempts
  const overallAverage = history.length ? Math.round(history.reduce((s, h) => s + (h.score || 0), 0) / history.length) : 0;

  // pass rate: count attempts with score >= qcm.passing_score (fallback 50)
  const passCount = history.reduce((count, h) => {
    const q = qcms.find(qc => qc.id === h.qcm_id) || {};
    // Prefer explicitly stored passed flag; fallback to qcm.passing_score or 50
    if (typeof h.passed !== 'undefined') return count + (h.passed ? 1 : 0);
    const passing = q.passing_score || q.passingScore || 50;
    return count + ((h.score || 0) >= passing ? 1 : 0);
  }, 0);
  const passRate = history.length ? Math.round((passCount / history.length) * 100) : 0;

  // average correct answers per attempt — prefer feedback if available, otherwise estimate
  const correctCounts = history.map(h => {
    if (Array.isArray(h.feedback) && h.feedback.length) {
      return h.feedback.filter(f => f.correct).length;
    }
    // fallback: estimate from score and question count (if qcm available)
    const q = qcms.find(qc => qc.id === h.qcm_id) || {};
    const qCount = (q.questions && q.questions.length) || (h.total_questions) || null;
    if (qCount) {
      return Math.round(((h.score || 0) / 100) * qCount);
    }
    return null;
  }).filter(v => v !== null);
  const avgCorrectPerAttempt = correctCounts.length ? (Math.round(correctCounts.reduce((s, v) => s + v, 0) / correctCounts.length)) : 'N/A';

  const handleLogout = () => {
    setConfirmLogout(true);
  };

  const doLogout = () => {
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
          <div className="sidebar-logo" role="banner">QCM-Net</div>
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
          <a href="/qcms/student" className={`nav-item ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigate('/qcms/student'); }}>
            <span className="nav-icon">📝</span>
            Available QCMs
          </a>
          <a href="/my-results" className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigate('/my-results'); }}>
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
            {/* Stats Grid (dynamic) */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3 className="stat-value">{totalTaken}</h3>
                <p className="stat-label">Attempts</p>
              </div>
              <div className="stat-card success">
                <h3 className="stat-value">{overallAverage}%</h3>
                <p className="stat-label">Overall Average</p>
              </div>
              <div className="stat-card warning">
                <h3 className="stat-value">{passRate}%</h3>
                <p className="stat-label">Pass Rate</p>
              </div>
              <div className="stat-card danger">
                <h3 className="stat-value">{avgCorrectPerAttempt}</h3>
                <p className="stat-label">Avg Correct / Attempt</p>
              </div>
            </div>

            <div className="content-grid">
              {/* Available Quizzes */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Available QCMs</h3>
                  <button className="btn btn-outline btn-sm QQQ" onClick={() => navigate('/qcms/student')}>View All</button>
                </div>
                <div className="quiz-grid">
                  {(() => {
                    // determine taken qcm ids from history
                    const takenIds = new Set(history.map(h => h.qcm_id));
                    // sort untaken first, then taken
                    const sorted = [...qcms].sort((a, b) => {
                      const aTaken = takenIds.has(a.id) ? 1 : 0;
                      const bTaken = takenIds.has(b.id) ? 1 : 0;
                      if (aTaken !== bTaken) return aTaken - bTaken; // untaken (0) before taken (1)
                      // fallback sort by start_date or title
                      if (a.start_date && b.start_date) return new Date(a.start_date) - new Date(b.start_date);
                      return (a.title || '').localeCompare(b.title || '');
                    });

                    const limited = sorted.slice(0, 4);

                    return limited.map(quiz => (
                      <div key={quiz.id} className="quiz-card">
                        <div className="quiz-header">
                          <h4 className="quiz-title">{quiz.title}</h4>
                          <div className="quiz-meta">
                            <span>{subjectName(quiz.subject)}</span>
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
                            <button className="btn btn-outline btn-sm" onClick={() => navigate('/qcms/student')}>View Details</button>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                {qcms.length > 4 && (
                  <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                    <button className="btn btn-link" onClick={() => navigate('/qcms/student')}>Show more</button>
                  </div>
                )}
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history
                      .slice()
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .slice(0,4)
                      .map(attempt => {
                      const qcm = qcms.find(q => q.id === attempt.qcm_id) || {};
                      return (
                        <tr key={attempt.id}>
                          <td><strong>{qcm.title || attempt.qcm_title || 'Quiz'}</strong></td>
                          <td>
                            <span className={`score ${attempt.score >= 80 ? 'high' : attempt.score >= 60 ? 'medium' : 'low'}`}>
                              {attempt.score}%
                            </span>
                          </td>
                          <td>{new Date(attempt.created_at).toLocaleString()}</td>
                          <td>{attempt.duration ? `${Math.floor(attempt.duration/60)}m ${attempt.duration%60}s` : 'N/A'}</td>
                          <td>
                            <button className="btn btn-outline btn-sm" onClick={() => {
                              // navigate to detailed results page
                              navigate('/dashboard/student');
                              // open results in a modal on StudentQcms or MyResults; for now navigate to MyResults
                              navigate('/dashboard/student');
                            }}>View Details</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {history.length === 0 && (
                  <div style={{ padding: '1rem' }} className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h4>No quiz attempts yet</h4>
                    <p>Take a quiz to see results here.</p>
                  </div>
                )}
                {history.length > 4 && (
                  <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                    <button className="btn btn-link" onClick={() => navigate('/my-results')}>See all results</button>
                  </div>
                )}
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
                        <span>{subjectName(quiz.subject)}</span>
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
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3 className="stat-value">{quizzesTaken}</h3>
                    <p className="stat-label">Quizzes Taken</p>
                  </div>
                  <div className="stat-card success">
                    <h3 className="stat-value">{averageScore}%</h3>
                    <p className="stat-label">Average Score</p>
                  </div>
                  <div className="stat-card warning">
                    <h3 className="stat-value">{improvement}</h3>
                    <p className="stat-label">Improvement</p>
                  </div>
                  <div className="stat-card danger">
                    <h3 className="stat-value">{profile?.rank || '—'}</h3>
                    <p className="stat-label">Class Rank</p>
                  </div>
                </div>

                <h4 style={{ marginTop: '1rem' }}>Performance by Topic</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  {performanceByTopic.length === 0 ? (
                    <div>No topic performance available yet.</div>
                  ) : performanceByTopic.map(p => (
                    <div key={p.subject}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>{p.subject}</span>
                        <span>{p.average}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${p.average}%` }}></div>
                      </div>
                    </div>
                  ))}

                </div>

                <h4 style={{ marginTop: '1rem' }}>Performance by Difficulty</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  {performanceByDifficulty.length === 0 ? (
                    <div>No difficulty data available yet.</div>
                  ) : performanceByDifficulty.map(d => (
                    <div key={d.difficulty}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>{d.difficulty}</span>
                        <span>{d.percent}% ({d.correct}/{d.total})</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${d.percent}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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

export default StudentDashboard;