import React, { useState, useEffect } from 'react';

export default function QcmForm({ initial = {}, onSubmit, onCancel, mode = 'create' }) {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    published: false,
    duration: 60,
    difficulty: 'medium',
    maxAttempts: 1,
    startDate: '',
    endDate: '',
    shuffleQuestions: false,
    showResults: 'after_submission',
    passingScore: 60,
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const [subjects, setSubjects] = useState([]);

  // helper: convert server datetime (ISO or SQL) to datetime-local input value
  const toLocalInput = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const pad = n => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  useEffect(() => {
    if (initial && Object.keys(initial).length) {
      // normalize server keys to the form's state shape
      setFormData(prev => ({
        ...prev,
        title: initial.title || prev.title,
        subject: initial.subject || prev.subject,
        description: initial.description || prev.description,
        published: typeof initial.published === 'boolean' ? initial.published : prev.published,
        duration: initial.duration ?? prev.duration,
        difficulty: initial.difficulty || prev.difficulty,
        maxAttempts: initial.max_attempts ?? initial.maxAttempts ?? prev.maxAttempts,
        startDate: initial.start_at ? toLocalInput(initial.start_at) : (initial.startDate || prev.startDate),
        endDate: initial.end_at ? toLocalInput(initial.end_at) : (initial.endDate || prev.endDate),
        shuffleQuestions: initial.shuffle_questions ?? initial.shuffleQuestions ?? prev.shuffleQuestions,
        showResults: initial.show_results || initial.showResults || prev.showResults,
        passingScore: initial.passing_score ?? initial.passingScore ?? prev.passingScore,
        tags: initial.tags || prev.tags || []
      }));
    }
  }, [initial]);

  useEffect(() => {
    // fetch subjects for the dropdown
    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d?.data || d || []))
      .catch(() => setSubjects([]));
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    // map formData to backend-friendly payload keys
    const payload = {
      title: formData.title,
      subject: formData.subject,
      description: formData.description,
      published: !!formData.published,
      duration: formData.duration ? Number(formData.duration) : null,
      difficulty: formData.difficulty,
      max_attempts: formData.maxAttempts ? Number(formData.maxAttempts) : null,
      start_at: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      end_at: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      passing_score: formData.passingScore ? Number(formData.passingScore) : null,
      shuffle_questions: !!formData.shuffleQuestions,
      show_results: formData.showResults,
      tags: formData.tags
    };

    onSubmit(payload);
    
    if (mode === 'create') {
      setFormData({
        title: '',
        subject: '',
        description: '',
        published: false,
  duration: 60,
  difficulty: 'medium',
  maxAttempts: 1,
  startDate: '',
  endDate: '',
        shuffleQuestions: false,
        showResults: 'after_submission',
        passingScore: 60,
        tags: []
      });
    }
  };

  return (
    <div className="qcm-form-container">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {mode === 'edit' ? 'Edit QCM' : 'Create New QCM'}
          </h3>
          {mode === 'edit' && (
            <span className="badge badge-info">Editing: {formData.title}</span>
          )}
        </div>

        <form onSubmit={submit} className="qcm-form">
          {/* Basic Information Section */}
          <div className="form-section">
            <h4 className="form-section-title">Basic Information</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  QCM Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter quiz title"
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select 
                  className="form-select"
                  value={formData.subject}
                  onChange={e => handleChange('subject', e.target.value)}
                >
                  <option value="">Select a subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the quiz content..."
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                rows="3"
              />
            </div>
          </div>

          {/* Settings Section */}
          <div className="form-section">
            <h4 className="form-section-title">Quiz Settings</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.duration}
                  onChange={e => handleChange('duration', e.target.value)}
                  min="1"
                  max="180"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select 
                  className="form-select"
                  value={formData.difficulty}
                  onChange={e => handleChange('difficulty', e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Max Attempts</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.maxAttempts}
                  onChange={e => handleChange('maxAttempts', e.target.value)}
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={formData.startDate}
                  onChange={e => handleChange('startDate', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={formData.endDate}
                  onChange={e => handleChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="form-section">
            <h4 className="form-section-title">Advanced Settings</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Passing Score (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.passingScore}
                  onChange={e => handleChange('passingScore', e.target.value)}
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Show Results</label>
                <select 
                  className="form-select"
                  value={formData.showResults}
                  onChange={e => handleChange('showResults', e.target.value)}
                >
                  <option value="after_submission">After Submission</option>
                  <option value="after_deadline">After Deadline</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={formData.shuffleQuestions}
                  onChange={e => handleChange('shuffleQuestions', e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                Shuffle questions
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={formData.published}
                  onChange={e => handleChange('published', e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                Publish this QCM
              </label>
            </div>
          </div>

          <div className="form-actions">
            {onCancel && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              className="btn btn-primary btn-icon"
            >
              <span>💾</span>
              {mode === 'edit' ? 'Update QCM' : 'Create QCM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}