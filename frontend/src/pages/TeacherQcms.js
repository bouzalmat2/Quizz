import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import QcmForm from '../components/QcmForm';
import QuestionForm from '../components/QuestionForm';
import ResultsView from '../components/ResultsView';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

export default function TeacherQcms() {
  const [qcms, setQcms] = useState([]);
  const [editing, setEditing] = useState(null);
  const [addingQuestionFor, setAddingQuestionFor] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [activeTab, setActiveTab] = useState('qcms');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [confirm, setConfirm] = useState({ open: false, id: null, onConfirm: null });
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, avgScore: 0 });

  const token = localStorage.getItem('qcm_user_token');
  const location = useLocation();

  useEffect(() => {
    fetchQcms();
  }, [token]);

  // react to navigation state to set the active tab (e.g., navigate('/qcms/teacher', { state: { tab: 'create' } }))
  useEffect(() => {
    if (location && location.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location]);

  useEffect(() => {
    calculateStats();
  }, [qcms]);

  function fetchQcms() {
    setIsLoading(true);
    fetch('/api/qcms', {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
      .then(r => r.json())
      .then(data => setQcms(data?.data || data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  function calculateStats() {
    const total = qcms.length;
    const published = qcms.filter(q => q.published).length;
    const draft = total - published;

    // Collect results for every qcm: use embedded qcm.results when available, otherwise fetch
    const promises = qcms.map(qcm => {
      if (Array.isArray(qcm.results)) return Promise.resolve(qcm.results);
      return fetch(`/api/results/qcm/${qcm.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
        .then(r => r.json())
        .then(d => d?.data || d || [])
        .catch(() => []);
    });

    Promise.all(promises)
      .then(arrs => {
        const allResults = arrs.flat();
        const totalScore = allResults.reduce((s, res) => s + (res.score || 0), 0);
        const scoreCount = allResults.length;
        const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
        setStats({ total, published, draft, avgScore });
      })
      .catch(err => {
        console.error('Failed to load results for stats', err);
        setStats({ total, published, draft, avgScore: 0 });
      });
  }

  function createQcm(payload) {
    setIsLoading(true);
    fetch('/api/qcms', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: token ? `Bearer ${token}` : '' 
      },
      body: JSON.stringify(payload),
    })
      .then(async r => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(json?.error || json?.message || 'Failed to create QCM');
        }
        const created = json?.data || json || {};
        setQcms(prev => [created, ...prev]);
        showMessage('success', 'QCM created successfully!');
        setActiveTab('qcms');
      })
      .catch(err => {
        showMessage('error', err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function updateQcm(id, payload) {
    setIsLoading(true);
    fetch(`/api/qcms/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: token ? `Bearer ${token}` : '' 
      },
      body: JSON.stringify(payload),
    })
      .then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error('Update failed');
        setQcms(prev => prev.map(q => (q.id === id ? json : q)));
        setEditing(null);
        showMessage('success', 'QCM updated successfully!');
      })
      .catch(err => {
        showMessage('error', 'Failed to update QCM');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function deleteQcm(id) {
    setConfirm({ open: true, id, onConfirm: () => {
      setConfirm({ open: false, id: null, onConfirm: null });
      fetch(`/api/qcms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
        .then(async r => {
          if (!r.ok) throw new Error('Delete failed');
          setQcms(prev => prev.filter(q => q.id !== id));
          showMessage('success', 'QCM deleted successfully!');
        })
        .catch(err => {
          showMessage('error', 'Failed to delete QCM');
        });
    }});
  }

  function addQuestion(qcmId, question) {
    setIsLoading(true);
    fetch(`/api/qcms/${qcmId}/questions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: token ? `Bearer ${token}` : '' 
      },
      body: JSON.stringify(question),
    })
      .then(async r => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(json?.error || json?.message || 'Failed to add question');
        }
        setAddingQuestionFor(null);
        showMessage('success', 'Question added successfully!');
        // Refresh the QCMs to get updated question count
        fetchQcms();
      })
      .catch(err => {
        showMessage('error', err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function viewResults(qcmId) {
    setIsLoading(true);
    fetch(`/api/results/qcm/${qcmId}`, { 
      headers: { Authorization: token ? `Bearer ${token}` : '' } 
    })
      .then(r => r.json())
      .then(data => {
        const list = (data?.data || data || []).map(item => ({ ...item, qcm: qcms.find(q => q.id === qcmId) || null }));
        setResults(list);
        setSelectedResult(null);
        setActiveTab('results');
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  // Load all results across the teacher's QCMs (aggregate qcm.results when available)
  function loadAllResults() {
    // If qcms already include results from the API, aggregate them
    const aggregated = qcms.reduce((acc, q) => {
      if (Array.isArray(q.results) && q.results.length) {
        q.results.forEach(r => acc.push({ ...r, qcm: q }));
      }
      return acc;
    }, []);

    if (aggregated.length) {
      setResults(aggregated);
      setSelectedResult(null);
      setActiveTab('results');
      return;
    }

    // Fallback: fetch results per QCM sequentially and aggregate
    setIsLoading(true);
    const promises = qcms.map(q =>
      fetch(`/api/results/qcm/${q.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
        .then(r => r.json())
        .then(d => (d?.data || d || []).map(item => ({ ...item, qcm: q })))
        .catch(() => [])
    );

    Promise.all(promises)
      .then(arrs => {
        const list = arrs.flat();
        setResults(list);
        setSelectedResult(null);
        setActiveTab('results');
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  function showMessage(type, text) {
    // keep backward-compatible message state for existing UI, but also show toast
    setMessage({ type, text });
    setToast({ message: text, type: type === 'error' ? 'error' : 'info' });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }

  function getQuestionCount(qcm) {
    return qcm.questions?.length || 0;
  }

  function getStudentCount(qcm) {
    return qcm.results?.length || 0;
  }

  return (
    <>
    <div className="teacher-qcms-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Manage Your QCMs</h2>
          <p className="card-subtitle">Create, edit, and monitor your computer networking quizzes</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total QCMs</div>
          </div>
          <div className="stat-card published">
            <div className="stat-value">{stats.published}</div>
            <div className="stat-label">Published</div>
          </div>
          <div className="stat-card draft">
            <div className="stat-value">{stats.draft}</div>
            <div className="stat-label">Drafts</div>
          </div>
          <div className="stat-card avg-score">
            <div className="stat-value">{stats.avgScore}%</div>
            <div className="stat-label">Avg Score</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="qcms-tabs">
          <button
            className={`tab-button ${activeTab === 'qcms' ? 'active' : ''}`}
            onClick={() => setActiveTab('qcms')}
          >
            📚 My QCMs
          </button>
          <button
            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            ➕ Create New
          </button>
          <button
            className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => loadAllResults()}
          >
            📊 Results
          </button>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}

        {/* Create QCM Tab */}
        {activeTab === 'create' && (
          <div className="tab-content">
            <QcmForm 
              onSubmit={createQcm}
              onCancel={() => setActiveTab('qcms')}
            />
          </div>
        )}

        {/* My QCMs Tab */}
        {activeTab === 'qcms' && (
          <div className="tab-content">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner large"></div>
                <p>Loading your QCMs...</p>
              </div>
            ) : qcms.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No QCMs Yet</h3>
                <p>Create your first computer networking quiz to get started!</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('create')}
                >
                  Create Your First QCM
                </button>
              </div>
            ) : (
              <div className="qcms-grid">
                {qcms.map(qcm => (
                  <div key={qcm.id} className="qcm-card">
                    <div className="qcm-header">
                      <div className="qcm-title-section">
                        <h3 className="qcm-title">{qcm.title}</h3>
                        <span className="qcm-subject">{(qcm.subject && qcm.subject.name) ? qcm.subject.name : (qcm.subject || '')}</span>
                      </div>
                      <div className="qcm-status">
                        <span className={`status-badge ${qcm.published ? 'published' : 'draft'}`}>
                          {qcm.published ? '📢 Published' : '📝 Draft'}
                        </span>
                      </div>
                    </div>

                    <div className="qcm-meta">
                      <div className="meta-item">
                        <span className="meta-icon">❓</span>
                        {getQuestionCount(qcm)} questions
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">👥</span>
                        {getStudentCount(qcm)} students
                      </div>
                      {qcm.duration && (
                        <div className="meta-item">
                          <span className="meta-icon">⏱️</span>
                          {qcm.duration}m
                        </div>
                      )}
                    </div>

                    <div className="qcm-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setEditing(editing?.id === qcm.id ? null : qcm)}
                      >
                        {editing?.id === qcm.id ? 'Cancel Edit' : '✏️ Edit'}
                      </button>
                      
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setAddingQuestionFor(addingQuestionFor === qcm.id ? null : qcm.id)}
                      >
                        {addingQuestionFor === qcm.id ? 'Cancel' : '➕ Add Question'}
                      </button>
                      
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => viewResults(qcm.id)}
                      >
                        📊 Results
                      </button>
                      
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteQcm(qcm.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>

                    {/* Edit Form */}
                    {editing && editing.id === qcm.id && (
                      <div className="edit-section">
                        <QcmForm 
                          initial={editing} 
                          onSubmit={payload => updateQcm(qcm.id, payload)}
                          onCancel={() => setEditing(null)}
                        />
                      </div>
                    )}

                    {/* Add Question Form */}
                    {addingQuestionFor === qcm.id && (
                      <div className="question-section">
                        <QuestionForm 
                          onSubmit={question => addQuestion(qcm.id, question)} 
                          onCancel={() => setAddingQuestionFor(null)} 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="tab-content">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner large"></div>
                <p>Loading results...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No Results Yet</h3>
                <p>Select a QCM to view student results and performance analytics.</p>
              </div>
            ) : (
              <div className="results-container">
                <div className="results-header">
                  <h3>Student Results</h3>
                  <span className="results-count">{results.length} submissions</span>
                </div>
                
                <div className="results-list">
                  {(() => {
                    // group results by qcm id (use result.qcm?.id or result.qcm_id)
                    const groups = results.reduce((acc, r) => {
                      const qid = (r.qcm && r.qcm.id) || r.qcm_id || r.qcmId || 'unknown';
                      if (!acc[qid]) acc[qid] = [];
                      acc[qid].push(r);
                      return acc;
                    }, {});

                    return Object.entries(groups).map(([qid, items]) => {
                      const qcm = items[0].qcm || qcms.find(q => q.id === parseInt(qid, 10)) || { title: 'Unknown QCM' };
                      return (
                        <div key={qid} className="results-group">
                          <div className="results-group-header">
                            <h4>{qcm.title}</h4>
                            <div className="results-group-meta">{items.length} submission{items.length > 1 ? 's' : ''}</div>
                          </div>
                          <div className="results-group-items">
                            {items.map(result => (
                              <div key={result.id} className="result-item">
                                <div className="result-info">
                                  <div className="student-name">
                                    {result.student?.name || `Student ${result.student_id}`}
                                  </div>
                                  <div className="result-meta">
                                    <span className="score">Score: {result.score}%</span>
                                    <span className="date">{new Date(result.created_at).toLocaleString()}</span>
                                    {result.duration && (
                                      <span className="duration">Time: {Math.floor(result.duration / 60)}m {result.duration % 60}s</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => setSelectedResult(selectedResult?.id === result.id ? null : result)}
                                >
                                  {selectedResult?.id === result.id ? 'Hide Details' : 'View Details'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Detailed Result View */}
                {selectedResult && (
                  <div className="detailed-result">
                    <ResultsView 
                      result={selectedResult} 
                      onClose={() => setSelectedResult(null)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    <ConfirmModal 
      open={confirm.open}
      title="Delete QCM"
      message="Are you sure you want to delete this QCM? This action cannot be undone."
      onConfirm={confirm.onConfirm}
      onCancel={() => setConfirm({ open: false, id: null, onConfirm: null })}
    />
    <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </>
  );
}