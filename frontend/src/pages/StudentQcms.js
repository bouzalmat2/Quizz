import React, { useEffect, useState } from 'react';
import TakeQuiz from '../components/TakeQuiz';
import ResultsView from '../components/ResultsView';
import Toast from '../components/Toast';

export default function StudentQcms() {
  const [qcms, setQcms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingQcm, setLoadingQcm] = useState(false);
  const [history, setHistory] = useState([]);
  const [viewingResult, setViewingResult] = useState(null);
  const [recentResult, setRecentResult] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('qcm_user_token');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    loadQcms();
    loadHistory();
  }, [token]);

  function loadQcms() {
    setLoading(true);
    fetch('/api/qcms', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then(r => r.json())
      .then(data => {
        const list = data?.data || data || [];
        setQcms(list.filter(q => q.published));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  function loadHistory() {
    const userId = localStorage.getItem('qcm_user_id');
    if (userId) {
      fetch(`/api/results/student/${userId}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
        .then(r => r.json())
        .then(d => setHistory(d.data || d || []))
        .catch(console.error);
    }
  }

  function startQuiz(qcm) {
    setLoadingQcm(true);
    fetch(`/api/qcms/${qcm.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then(r => r.json())
      .then(full => setSelected(full))
      .catch(console.error)
      .finally(() => setLoadingQcm(false));
  }

  function submit(qcmId, answers, isAutoSubmit = false, duration = null) {
    return fetch(`/api/qcms/${qcmId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ answers, duration }),
    })
      .then(r => r.json())
      .then(result => {
        if (!isAutoSubmit) {
          setToast({ message: `Quiz submitted successfully! Your score: ${result.score}%`, type: 'info' });
        }
        // Show a quick modal for the recent submission (pass/fail/duration)
        setRecentResult({
          qcmId,
          score: result.score,
          passed: typeof result.passed !== 'undefined' ? result.passed : (result.score >= 60),
          duration: result.duration || duration || null,
        });

        setSelected(null);
        loadHistory(); // Refresh history
        return result;
      })
      .catch(err => {
        console.error(err);
        throw err;
      });
  }

  function viewResult(resultId) {
    fetch(`/api/results/${resultId}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then(r => r.json())
      .then(data => setViewingResult(data))
      .catch(console.error);
  }

  // Filter available QCMs
  const filteredQcms = qcms.filter(qcm => {
    const matchesSearch = qcm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ((qcm.subject && qcm.subject.name ? qcm.subject.name : qcm.subject || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (qcm.description && qcm.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const now = new Date();
    const startDate = qcm.start_date ? new Date(qcm.start_date) : null;
    const endDate = qcm.end_date ? new Date(qcm.end_date) : null;

    if (filter === 'available') {
      const isAvailable = (!startDate || startDate <= now) && (!endDate || endDate >= now);
      return matchesSearch && isAvailable;
    }
    
    if (filter === 'upcoming') {
      const isUpcoming = startDate && startDate > now;
      return matchesSearch && isUpcoming;
    }
    
    if (filter === 'expired') {
      const isExpired = endDate && endDate < now;
      return matchesSearch && isExpired;
    }

    return matchesSearch;
  });

  // Filter history
  const filteredHistory = history.filter(h => {
    const qcm = qcms.find(q => q.id === h.qcm_id);
    if (!qcm) return false;
    
    return qcm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (qcm.subject && qcm.subject.name ? qcm.subject.name : qcm.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getQcmStatus = (qcm) => {
    const now = new Date();
    const startDate = qcm.start_date ? new Date(qcm.start_date) : null;
    const endDate = qcm.end_date ? new Date(qcm.end_date) : null;

    if (startDate && startDate > now) return 'upcoming';
    if (endDate && endDate < now) return 'expired';
    return 'available';
  };

  const subjectName = (subject) => {
    if (!subject) return '';
    if (typeof subject === 'object') return subject.name || '';
    return subject;
  };

  const getAttemptCount = (qcmId) => {
    return history.filter(h => h.qcm_id === qcmId).length;
  };

  const getBestScore = (qcmId) => {
    const attempts = history.filter(h => h.qcm_id === qcmId);
    return attempts.length > 0 ? Math.max(...attempts.map(h => h.score)) : null;
  };

  return (
    <div className="student-qcms-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Available Quizzes</h2>
          <p className="card-subtitle">Test your computer networking knowledge with interactive QCMs</p>
        </div>

        {/* Search and Filter */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search quizzes by title, subject, or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Quizzes
            </button>
            <button 
              className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
              onClick={() => setFilter('available')}
            >
              Available Now
            </button>
            <button 
              className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`filter-btn ${filter === 'expired' ? 'active' : ''}`}
              onClick={() => setFilter('expired')}
            >
              Expired
            </button>
          </div>
        </div>

        {/* Available QCMs Grid */}
        <div className="qcms-section">
          <h3 className="section-title">
            {filter === 'all' ? 'All Quizzes' :
             filter === 'available' ? 'Available Now' :
             filter === 'upcoming' ? 'Upcoming Quizzes' : 'Expired Quizzes'}
            <span className="count-badge">{filteredQcms.length}</span>
          </h3>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading quizzes...</p>
            </div>
          ) : filteredQcms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h4>No quizzes found</h4>
              <p>
                {searchTerm ? 'No quizzes match your search criteria.' :
                 filter === 'available' ? 'No quizzes are currently available.' :
                 filter === 'upcoming' ? 'No upcoming quizzes scheduled.' :
                 filter === 'expired' ? 'No expired quizzes.' :
                 'No quizzes have been published yet.'}
              </p>
            </div>
          ) : (
            <div className="qcms-grid">
              {filteredQcms.map(qcm => {
                const status = getQcmStatus(qcm);
                const attempts = getAttemptCount(qcm.id);
                const bestScore = getBestScore(qcm.id);
                const canRetake = qcm.max_attempts ? attempts < qcm.max_attempts : true;

                return (
                  <div key={qcm.id} className="qcm-card">
                    <div className="qcm-header">
                      <h4 className="qcm-title">{qcm.title}</h4>
                      <div className="qcm-meta">
                        <span className="subject-badge">{(qcm.subject && qcm.subject.name) ? qcm.subject.name : (qcm.subject || '')}</span>
                        <span className={`status-badge status-${status}`}>
                          {status === 'available' ? 'Available' :
                           status === 'upcoming' ? 'Upcoming' : 'Expired'}
                        </span>
                      </div>
                    </div>

                    <div className="qcm-body">
                      {qcm.description && (
                        <p className="qcm-description">{qcm.description}</p>
                      )}
                      
                      <div className="qcm-stats">
                        <div className="stat">
                          <span className="stat-label">Questions</span>
                          <span className="stat-value">{qcm.questions?.length || 0}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Duration</span>
                          <span className="stat-value">{qcm.duration || 'N/A'} min</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Attempts</span>
                          <span className="stat-value">{attempts}{qcm.max_attempts ? `/${qcm.max_attempts}` : ''}</span>
                        </div>
                        {bestScore !== null && (
                          <div className="stat">
                            <span className="stat-label">Best Score</span>
                            <span className="stat-value success">{bestScore}%</span>
                          </div>
                        )}
                      </div>

                      {qcm.start_date && (
                        <div className="date-info">
                          <strong>Available:</strong> {new Date(qcm.start_date).toLocaleDateString()}
                          {qcm.end_date && ` - ${new Date(qcm.end_date).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>

                    <div className="qcm-actions">
                      {status === 'available' && (
                        <button
                          className={`btn btn-primary ${!canRetake ? 'btn-outline' : ''}`}
                          onClick={() => startQuiz(qcm)}
                          disabled={loadingQcm || !canRetake}
                        >
                          {loadingQcm ? 'Loading...' : 
                           !canRetake ? 'Max Attempts Reached' :
                           attempts > 0 ? 'Retake Quiz' : 'Start Quiz'}
                        </button>
                      )}
                      
                      {status === 'upcoming' && (
                        <button className="btn btn-outline" disabled>
                          Starts {qcm.start_date && new Date(qcm.start_date).toLocaleDateString()}
                        </button>
                      )}
                      
                      {status === 'expired' && (
                        <button className="btn btn-outline" disabled>
                          Quiz Expired
                        </button>
                      )}

                      {attempts > 0 && (
                        <button
                          className="btn btn-outline"
                          onClick={() => {
                            const latestAttempt = history
                              .filter(h => h.qcm_id === qcm.id)
                              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                            if (latestAttempt) viewResult(latestAttempt.id);
                          }}
                        >
                          View Last Result
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quiz History */}
        <div className="history-section">
          <h3 className="section-title">
            Your Quiz History
            <span className="count-badge">{filteredHistory.length}</span>
          </h3>

          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h4>No quiz history yet</h4>
              <p>Complete your first quiz to see your results here!</p>
            </div>
          ) : (
            <div className="history-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Date Taken</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(attempt => {
                    const qcm = qcms.find(q => q.id === attempt.qcm_id);
                    return (
                      <tr key={attempt.id}>
                        <td>
                          <strong>{qcm?.title || 'Unknown Quiz'}</strong>
                        </td>
                        <td>{subjectName(qcm?.subject) || 'N/A'}</td>
                        <td>
                          <span className={`score ${attempt.score >= 80 ? 'high' : attempt.score >= 60 ? 'medium' : 'low'}`}>
                            {attempt.score}%
                          </span>
                        </td>
                        <td>{new Date(attempt.created_at).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => viewResult(attempt.id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selected && (
        <div className="modal-overlay">
          <div className="modal-content">
            <TakeQuiz 
              qcm={selected} 
              onSubmit={(answers, isAutoSubmit, duration) => submit(selected.id, answers, isAutoSubmit, duration)} 
              onCancel={() => setSelected(null)} 
            />
          </div>
        </div>
      )}

      {/* Recent submission summary popup */}
      {recentResult && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Quiz Submitted</h3>
                <button className="btn-close" onClick={() => setRecentResult(null)}>×</button>
              </div>
              <div className="card-body">
                <p><strong>Score:</strong> {recentResult.score}%</p>
                <p><strong>Result:</strong> {recentResult.passed ? 'Passed ✅' : 'Not Passed ❌'}</p>
                {recentResult.duration !== null && (
                  <p><strong>Duration:</strong> {Math.floor(recentResult.duration / 60)}m {recentResult.duration % 60}s</p>
                )}
                {/* indicate time expired if duration meets or exceeds qcm duration */}
                {(() => {
                  const q = qcms.find(qc => qc.id === recentResult.qcmId);
                  if (q && q.duration && recentResult.duration >= q.duration * 60) {
                    return <p className="warning-text">Time expired — answers auto-submitted.</p>;
                  }
                  return null;
                })()}
              </div>
              <div className="card-actions">
                <button className="btn btn-primary" onClick={() => setRecentResult(null)}>OK</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingResult && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ResultsView 
              result={viewingResult} 
              onClose={() => setViewingResult(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}