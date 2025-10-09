import React, { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ 
    text: '', 
    options: ['', ''], 
    correct_answer: '', 
    explanation: '',
    difficulty: 'medium',
    subject: 'Computer Networks'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [loading, setLoading] = useState(false);
  
  const token = localStorage.getItem('qcm_user_token');
  const [qcms, setQcms] = useState([]);
  const [attachSelection, setAttachSelection] = useState({});
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [confirm, setConfirm] = useState({ open: false, id: null, onConfirm: null });
  const [expandedQcms, setExpandedQcms] = useState([]);
  const [expandedQuestions, setExpandedQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('bank');

  useEffect(() => {
    loadQuestions();
    loadQcms();
  }, [token]);

  function loadQuestions() {
    setLoading(true);
    fetch('/api/bank/questions', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then(r => r.json())
      .then(d => setQuestions(d || []))
      .catch(err => setToast({ message: 'Failed to load questions', type: 'error' }))
      .finally(() => setLoading(false));
  }

  function loadQcms() {
    fetch('/api/qcms', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then(r => r.json())
      .then(d => {
        const list = d?.data || d || [];
        setQcms(list);
      })
      .catch(console.error);
  }

  function loadToForm(q) {
    setEditing(q);
    setForm({ 
      text: q.text, 
      options: q.options || ['', ''], 
      correct_answer: q.correct_answer, 
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      subject: q.subject || 'Computer Networks'
    });
  }

  function submit(e) {
    e.preventDefault();
    const url = editing ? `/api/bank/questions/${editing.id}` : '/api/bank/questions';
    const method = editing ? 'PUT' : 'POST';
    
    setLoading(true);
    fetch(url, { 
      method, 
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: token ? `Bearer ${token}` : '' 
      }, 
      body: JSON.stringify(form) 
    })
      .then(async r => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) { 
          setToast({ message: 'Error: ' + (json.error || JSON.stringify(json)), type: 'error' }); 
          return; 
        }
        if (editing) {
          setQuestions(prev => prev.map(p => p.id === editing.id ? json : p));
        } else {
          setQuestions(prev => [json, ...prev]);
        }
        resetForm();
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  function resetForm() {
    setForm({ 
      text: '', 
      options: ['', ''], 
      correct_answer: '', 
      explanation: '',
      difficulty: 'medium',
      subject: 'Computer Networks'
    });
    setEditing(null);
  }

  // remove a bank question. Deletion is allowed even if attached to a QCM — show a stronger confirmation warning.
  function remove(id) {
    // show confirmation modal
    setConfirm({ open: true, id, onConfirm: () => {
      setConfirm({ open: false, id: null, onConfirm: null });
      fetch(`/api/bank/questions/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: token ? `Bearer ${token}` : '' } 
      })
        .then(async r => {
          const json = await r.json().catch(() => ({}));
          if (r.ok) {
            // remove from local lists
            setQuestions(prev => prev.filter(q => q.id !== id));
            // also refresh QCMs in case it was attached
            loadQcms();
            setToast({ message: (json.message || 'Question deleted'), type: 'info' });
          } else {
            setToast({ message: 'Delete failed: ' + (json.error || JSON.stringify(json)), type: 'error' });
          }
        })
        .catch(() => setToast({ message: 'Delete failed', type: 'error' }));
    }});
  }

  function attach(bankId) {
  const qcmId = attachSelection[bankId];
  if (!qcmId) { setToast({ message: 'Please select a QCM to attach to.', type: 'error' }); return; }
    fetch(`/api/bank/questions/${bankId}/attach/${qcmId}`, { 
      method: 'POST', 
      headers: { Authorization: token ? `Bearer ${token}` : '' } 
    })
      .then(async r => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) { 
          setToast({ message: 'Attach failed: ' + (json.error || JSON.stringify(json)), type: 'error' }); 
          return; 
        }
        setToast({ message: 'Question successfully attached to QCM!', type: 'info' });
        // refresh qcms and bank list to reflect the moved question
        loadQcms();
        loadQuestions();
      })
      .catch(console.error);
  }

  function addOption() {
    if (form.options.length < 6) {
      setForm(f => ({ ...f, options: [...f.options, ''] }));
    }
  }

  function removeOption(index) {
    if (form.options.length > 2) {
      setForm(f => ({ 
        ...f, 
        options: f.options.filter((_, i) => i !== index) 
      }));
    }
  }

  function updateOption(index, value) {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm(f => ({ ...f, options: newOptions }));
  }

  // Filter questions based on search and filters
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchesSubject = filterSubject === 'all' || q.subject === filterSubject;
    
    return matchesSearch && matchesDifficulty && matchesSubject;
  });

  const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];

  return (
    <>
    <div className="question-bank-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Question Bank</h2>
          <p className="card-subtitle">Manage your question library and organize by QCMs</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'bank' ? 'active' : ''}`}
            onClick={() => setActiveTab('bank')}
          >
            📚 Question Bank
          </button>
          <button 
            className={`tab ${activeTab === 'qcms' ? 'active' : ''}`}
            onClick={() => setActiveTab('qcms')}
          >
            📝 My QCMs
          </button>
        </div>

        {activeTab === 'bank' && (
          <div className="bank-content">
            <div className="bank-layout">
              {/* Question Form */}
              <div className="form-section">
                <div className="section-header">
                  <h3>{editing ? 'Edit Question' : 'Add New Question'}</h3>
                  {editing && (
                    <span className="badge badge-warning">Editing</span>
                  )}
                </div>
                
                <form onSubmit={submit} className="question-form">
                  <div className="form-group">
                    <label className="form-label">Question Text *</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Enter your question text..."
                      value={form.text}
                      onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                      required
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <select 
                        className="form-select"
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      >
                        <option value="Computer Networks">Computer Networks</option>
                        <option value="Network Security">Network Security</option>
                        <option value="TCP/IP Protocols">TCP/IP Protocols</option>
                        <option value="Wireless Networks">Wireless Networks</option>
                        <option value="Network Architecture">Network Architecture</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Difficulty</label>
                      <select 
                        className="form-select"
                        value={form.difficulty}
                        onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Answer Options *</label>
                    <div className="options-list">
                      {form.options.map((opt, i) => (
                        <div key={i} className="option-input-group">
                          <input
                            type="text"
                            className="form-input"
                            placeholder={`Option ${i + 1}...`}
                            value={opt}
                            onChange={e => updateOption(i, e.target.value)}
                            required
                          />
                          {form.options.length > 2 && (
                            <button
                              type="button"
                              className="btn-remove-option"
                              onClick={() => removeOption(i)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {form.options.length < 6 && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={addOption}
                      >
                        + Add Option
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Correct Answer *</label>
                    <select 
                      className="form-select"
                      value={form.correct_answer}
                      onChange={e => setForm(f => ({ ...f, correct_answer: e.target.value }))}
                      required
                    >
                      <option value="">Select correct answer</option>
                      {form.options.filter(opt => opt.trim()).map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt || `Option ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Explanation</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Provide explanation for the correct answer..."
                      value={form.explanation}
                      onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                      rows="3"
                    />
                  </div>

                  <div className="form-actions">
                    {editing && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={resetForm}
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : (editing ? 'Update Question' : 'Save to Bank')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Question List grouped by QCM */}
              <div className="list-section">
                <div className="section-header">
                  <h3>Your Question Bank ({filteredQuestions.length})</h3>
                  <div className="filters">
                    <input
                      type="text"
                      className="form-input search-input"
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    <select 
                      className="form-select filter-select"
                      value={filterDifficulty}
                      onChange={e => setFilterDifficulty(e.target.value)}
                    >
                      <option value="all">All Difficulties</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <select 
                      className="form-select filter-select"
                      value={filterSubject}
                      onChange={e => setFilterSubject(e.target.value)}
                    >
                      <option value="all">All Subjects</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="questions-grid grouped">
                  {loading ? (
                    <div className="loading">Loading questions...</div>
                  ) : (
                    <>
                        {/* Unassigned bank questions (qcm_id == null) */}
                        <div className="qcm-group unassigned">
                        <div className="group-header"><h4>Unassigned Questions</h4></div>
                        <div className="group-questions">
                          {filteredQuestions.filter(q => !q.qcm_id).map(q => (
                            <div key={q.id} className="question-card">
                              <div className="question-header">
                                <h4 className="question-text">{q.text}</h4>
                                <div className="question-meta">
                                  <span className={`badge difficulty-${q.difficulty}`}>{q.difficulty}</span>
                                  <span className="badge badge-outline">{q.subject}</span>
                                </div>
                              </div>
                              <div className="question-options">
                                <strong>Options:</strong>
                                <div className="options-preview">
                                  {q.options.map((opt, i) => (
                                    <span key={i} className={`option-preview ${opt === q.correct_answer ? 'correct' : ''}`}>{opt}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="question-actions">
                                <button className="btn btn-outline btn-sm" onClick={() => loadToForm(q)}>Edit</button>
                                <button className="btn btn-outline btn-sm" onClick={() => remove(q.id)}>Delete</button>
                                <select
                                  value={attachSelection[q.id] || ''}
                                  onChange={e => setAttachSelection(s => ({ ...s, [q.id]: e.target.value }))}
                                  className="form-select"
                                  style={{ marginRight: 8 }}
                                >
                                  <option value="">Select QCM...</option>
                                  {qcms.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                  ))}
                                </select>
                                <button className="btn btn-primary btn-sm" onClick={() => attach(q.id)}>Attach</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* QCM groups: for each QCM, show its questions */}
                      {qcms.map(qcm => (
                        <div key={`group-${qcm.id}`} className="qcm-group">
                          <div className="group-header">
                            <h4>{qcm.title} <span className="group-meta">({(qcm.questions||[]).length})</span></h4>
                          </div>
                          <div className="group-questions">
                            {(qcm.questions || []).filter(q => {
                              // apply same filters/search to these questions
                              const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) || (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
                              const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
                              const matchesSubject = filterSubject === 'all' || q.subject === filterSubject;
                              return matchesSearch && matchesDifficulty && matchesSubject;
                            }).map(q => (
                              <div key={q.id} className="question-card">
                                <div className="question-header">
                                  <h4 className="question-text">{q.text}</h4>
                                  <div className="question-meta">
                                    <span className={`badge difficulty-${q.difficulty}`}>{q.difficulty}</span>
                                    <span className="badge badge-outline">{q.subject}</span>
                                  </div>
                                </div>
                                <div className="question-options">
                                  <strong>Options:</strong>
                                  <div className="options-preview">
                                    {q.options.map((opt, i) => (
                                      <span key={i} className={`option-preview ${opt === q.correct_answer ? 'correct' : ''}`}>{opt}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="question-actions">
                                  <button className="btn btn-outline btn-sm" onClick={() => loadToForm(q)}>Edit</button>
                                  <button className="btn btn-outline btn-sm" onClick={() => remove(q.id, !!q.qcm_id)}>Delete</button>
                                  <button className="btn btn-outline btn-sm" onClick={() => {
                                    // unassign this question from its QCM
                                    if (!q.qcm_id) { setToast({ message: 'Question is not assigned to a QCM', type: 'error' }); return; }
                                    fetch(`/api/bank/questions/${q.id}/unassign`, { method: 'POST', headers: { Authorization: token ? `Bearer ${token}` : '' } })
                                      .then(async r => {
                                        const json = await r.json().catch(() => ({}));
                                        if (!r.ok) { setToast({ message: 'Unassign failed: ' + (json.error || JSON.stringify(json)), type: 'error' }); return; }
                                        setToast({ message: 'Question unassigned successfully', type: 'info' });
                                        loadQcms();
                                        loadQuestions();
                                      })
                                      .catch(() => setToast({ message: 'Unassign failed', type: 'error' }));
                                  }}>Unassign</button>
                                  {/* allow moving this question to another QCM */}
                                  <select
                                    value={attachSelection[q.id] || ''}
                                    onChange={e => setAttachSelection(s => ({ ...s, [q.id]: e.target.value }))}
                                    className="form-select"
                                    style={{ marginRight: 8, marginLeft: 8 }}
                                  >
                                    <option value="">Move to QCM...</option>
                                    {qcms.filter(c => c.id !== q.qcm_id).map(c => (
                                      <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                  </select>
                                  <button className="btn btn-primary btn-sm" onClick={() => {
                                    const dest = attachSelection[q.id];
                                    if (!dest) { setToast({ message: 'Select a destination QCM first', type: 'error' }); return; }
                                    // use attach to move question between QCMs
                                    fetch(`/api/bank/questions/${q.id}/attach/${dest}`, { method: 'POST', headers: { Authorization: token ? `Bearer ${token}` : '' } })
                                      .then(async r => {
                                        const json = await r.json().catch(() => ({}));
                                        if (!r.ok) { setToast({ message: 'Move failed: ' + (json.error || JSON.stringify(json)), type: 'error' }); return; }
                                        setToast({ message: 'Question moved successfully', type: 'info' });
                                        loadQcms();
                                        loadQuestions();
                                      })
                                      .catch(() => setToast({ message: 'Move failed', type: 'error' }));
                                  }}>Move</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Unassigned bank questions (qcm_id == null) */}
                      <div className="qcm-group unassigned">
                        <div className="group-header"><h4>Unassigned Questions</h4></div>
                        <div className="group-questions">
                          {filteredQuestions.filter(q => !q.qcm_id).map(q => (
                            <div key={q.id} className="question-card">
                              <div className="question-header">
                                <h4 className="question-text">{q.text}</h4>
                                <div className="question-meta">
                                  <span className={`badge difficulty-${q.difficulty}`}>{q.difficulty}</span>
                                  <span className="badge badge-outline">{q.subject}</span>
                                </div>
                              </div>
                              <div className="question-options">
                                <strong>Options:</strong>
                                <div className="options-preview">
                                  {q.options.map((opt, i) => (
                                    <span key={i} className={`option-preview ${opt === q.correct_answer ? 'correct' : ''}`}>{opt}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="question-actions">
                                <button className="btn btn-outline btn-sm" onClick={() => loadToForm(q)}>Edit</button>
                                <button className="btn btn-outline btn-sm" onClick={() => remove(q.id, !!q.qcm_id)}>Delete</button>
                                <select
                                  value={attachSelection[q.id] || ''}
                                  onChange={e => setAttachSelection(s => ({ ...s, [q.id]: e.target.value }))}
                                  className="form-select"
                                  style={{ marginRight: 8 }}
                                >
                                  <option value="">Select QCM...</option>
                                  {qcms.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                  ))}
                                </select>
                                <button className="btn btn-primary btn-sm" onClick={() => attach(q.id)}>Attach</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qcms' && (
          <div className="qcms-content">
            <div className="section-header">
              <h3>Your QCMs ({qcms.length})</h3>
            </div>
            
            <div className="qcms-grid">
              {qcms.map(qcm => (
                <div key={qcm.id} className="qcm-card">
                  <div className="qcm-header">
                    <div className="qcm-info">
                      <h4 className="qcm-title">{qcm.title}</h4>
                      <div className="qcm-meta">
                        <span className="qcm-subject">{(qcm.subject && qcm.subject.name) ? qcm.subject.name : (qcm.subject || '')}</span>
                        <span className={`status ${qcm.published ? 'published' : 'draft'}`}>
                          {qcm.published ? 'Published' : 'Draft'}
                        </span>
                        <span className="question-count">
                          {(qcm.questions || []).length} questions
                        </span>
                      </div>
                    </div>
                    <button 
                      className="btn-expand"
                      onClick={() => {
                        setExpandedQcms(prev => 
                          prev.includes(qcm.id) 
                            ? prev.filter(x => x !== qcm.id) 
                            : [...prev, qcm.id]
                        );
                      }}
                    >
                      {expandedQcms.includes(qcm.id) ? '▲' : '▼'}
                    </button>
                  </div>

                  {expandedQcms.includes(qcm.id) && (
                    <div className="qcm-questions">
                      <h5>Questions ({(qcm.questions || []).length})</h5>
                      {(qcm.questions || []).length === 0 ? (
                        <div className="empty-questions">No questions in this QCM yet.</div>
                      ) : (
                        (qcm.questions || []).map(question => (
                          <div key={question.id} className="question-item">
                            <div className="question-summary">
                              <div className="question-text">{question.text}</div>
                              <button 
                                className="btn-toggle"
                                onClick={() => setExpandedQuestions(prev => 
                                  prev.includes(question.id) 
                                    ? prev.filter(x => x !== question.id) 
                                    : [...prev, question.id]
                                )}
                              >
                                {expandedQuestions.includes(question.id) ? '▲' : '▼'}
                              </button>
                            </div>
                            
                            {expandedQuestions.includes(question.id) && (
                              <div className="question-details">
                                <div className="options-list">
                                  <strong>Options:</strong>
                                  <ul>
                                    {(question.options || []).map((opt, i) => (
                                      <li 
                                        key={i}
                                        className={opt === question.correct_answer ? 'correct-option' : ''}
                                      >
                                        {opt}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="question-meta">
                                  <span><strong>Correct:</strong> {question.correct_answer}</span>
                                  {question.difficulty && (
                                    <span><strong>Difficulty:</strong> {question.difficulty}</span>
                                  )}
                                </div>
                                {question.explanation && (
                                  <div className="explanation">
                                    <strong>Explanation:</strong> {question.explanation}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    <ConfirmModal 
      open={confirm.open}
      title="Delete Question"
      message="Are you sure you want to delete this question from your bank?"
      onConfirm={confirm.onConfirm}
      onCancel={() => setConfirm({ open: false, id: null, onConfirm: null })}
    />
    <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </>
  );
}