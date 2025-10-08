import React, { useEffect, useState } from 'react';

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
      .catch(console.error)
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
          alert('Error: ' + (json.error || JSON.stringify(json))); 
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

  function remove(id) {
    if (!window.confirm('Are you sure you want to delete this question from your bank?')) return;
    
    fetch(`/api/bank/questions/${id}`, { 
      method: 'DELETE', 
      headers: { Authorization: token ? `Bearer ${token}` : '' } 
    })
      .then(r => r.ok ? setQuestions(prev => prev.filter(q => q.id !== id)) : r.json().then(j => alert('Delete failed: ' + (j.error || JSON.stringify(j)))))
      .catch(console.error);
  }

  function attach(bankId) {
    const qcmId = window.prompt('Enter the QCM ID to attach this question to:');
    if (!qcmId) return;
    
    fetch(`/api/bank/questions/${bankId}/attach/${qcmId}`, { 
      method: 'POST', 
      headers: { Authorization: token ? `Bearer ${token}` : '' } 
    })
      .then(async r => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) { 
          alert('Attach failed: ' + (json.error || JSON.stringify(json))); 
          return; 
        }
        alert('Question successfully attached to QCM!');
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

              {/* Question List */}
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

                <div className="questions-grid">
                  {loading ? (
                    <div className="loading">Loading questions...</div>
                  ) : filteredQuestions.length === 0 ? (
                    <div className="empty-state">
                      {searchTerm || filterDifficulty !== 'all' || filterSubject !== 'all' ? 
                        'No questions match your filters.' : 
                        'No questions in your bank yet. Add your first question!'}
                    </div>
                  ) : (
                    filteredQuestions.map(q => (
                      <div key={q.id} className="question-card">
                        <div className="question-header">
                          <h4 className="question-text">{q.text}</h4>
                          <div className="question-meta">
                            <span className={`badge difficulty-${q.difficulty}`}>
                              {q.difficulty}
                            </span>
                            <span className="badge badge-outline">{q.subject}</span>
                          </div>
                        </div>
                        
                        <div className="question-options">
                          <strong>Options:</strong>
                          <div className="options-preview">
                            {q.options.map((opt, i) => (
                              <span 
                                key={i} 
                                className={`option-preview ${opt === q.correct_answer ? 'correct' : ''}`}
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>

                        {q.explanation && (
                          <div className="question-explanation">
                            <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}

                        <div className="question-actions">
                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => loadToForm(q)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => remove(q.id)}
                          >
                            Delete
                          </button>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => attach(q.id)}
                          >
                            Attach to QCM
                          </button>
                        </div>
                      </div>
                    ))
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
                        <span className="qcm-subject">{qcm.subject}</span>
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
  );
}