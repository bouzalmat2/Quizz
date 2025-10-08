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

  useEffect(() => {
    if (initial.title) {
      setFormData(prev => ({ ...prev, ...initial }));
    }
  }, [initial]);

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
    onSubmit(formData);
    
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
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Network Security">Network Security</option>
                  <option value="TCP/IP Protocols">TCP/IP Protocols</option>
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