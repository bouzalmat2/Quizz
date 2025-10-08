import React, { useState } from 'react';

export default function QuestionForm({ onSubmit, onCancel, initialQuestion = null }) {
  const [text, setText] = useState(initialQuestion?.text || '');
  const [options, setOptions] = useState(initialQuestion?.options || ['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(initialQuestion?.correct_answer || 0);
  const [explanation, setExplanation] = useState(initialQuestion?.explanation || '');
  const [difficulty, setDifficulty] = useState(initialQuestion?.difficulty || 'medium');
  const [imageUrl, setImageUrl] = useState(initialQuestion?.imageUrl || '');

  function submit(e) {
    e.preventDefault();
    
    // Validation
    const filledOptions = options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    if (!options[correctIndex]?.trim()) {
      alert('Correct option cannot be empty');
      return;
    }

    onSubmit({ 
      text, 
      options, 
      // send the correct answer as the option text (string) so backend validation 'string' passes
      correct_answer: options[correctIndex], 
      explanation,
      difficulty,
      imageUrl
    });
    
    if (!initialQuestion) {
      resetForm();
    }
  }

  function resetForm() {
    setText('');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
    setExplanation('');
    setDifficulty('medium');
    setImageUrl('');
  }

  function setOption(i, val) {
    const copy = [...options];
    copy[i] = val;
    setOptions(copy);
  }

  function addOption() {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  }

  function removeOption(index) {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      
      if (correctIndex === index) {
        setCorrectIndex(0);
      } else if (correctIndex > index) {
        setCorrectIndex(correctIndex - 1);
      }
    }
  }

  const isEditing = !!initialQuestion;

  return (
    <div className="question-form-container">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {isEditing ? 'Edit Question' : 'Add New Question'}
          </h3>
          {isEditing && (
            <span className="badge badge-warning">Editing Question</span>
          )}
        </div>

        <form onSubmit={submit} className="question-form">
          {/* Question Text */}
          <div className="form-group">
            <label className="form-label">
              Question Text <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Enter your question here..."
              value={text}
              onChange={e => setText(e.target.value)}
              required
              rows="3"
            />
            <div className="char-counter">
              {text.length}/500 characters
            </div>
          </div>

          {/* Image URL */}
          <div className="form-group">
            <label className="form-label">
              Image URL
              <span className="form-hint">Optional: Add an image to illustrate the question</span>
            </label>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/image.png"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <div className="image-preview">
                <img src={imageUrl} alt="Question illustration" />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={() => setImageUrl('')}
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          {/* Difficulty */}
          <div className="form-group">
            <label className="form-label">Difficulty Level</label>
            <div className="difficulty-selector">
              {['easy', 'medium', 'hard'].map(level => (
                <label key={level} className="difficulty-option">
                  <input
                    type="radio"
                    name="difficulty"
                    value={level}
                    checked={difficulty === level}
                    onChange={() => setDifficulty(level)}
                  />
                  <span className={`difficulty-label difficulty-${level}`}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="form-group">
            <label className="form-label">
              Answer Options <span className="required">*</span>
            </label>
            
            <div className="options-list">
              {options.map((opt, i) => (
                <div key={i} className={`option-item ${correctIndex === i ? 'correct-option' : ''}`}>
                  <div className="option-input-group">
                    <input
                      type="text"
                      className="form-input option-input"
                      placeholder={`Option ${i + 1}...`}
                      value={opt}
                      onChange={e => setOption(i, e.target.value)}
                      required
                    />
                    
                    <div className="option-actions">
                      <label className="correct-option-label">
                        <input
                          type="radio"
                          name="correct"
                          checked={correctIndex === i}
                          onChange={() => setCorrectIndex(i)}
                          className="correct-radio"
                        />
                        <span className="correct-indicator">
                          {correctIndex === i ? '✓ Correct' : 'Mark Correct'}
                        </span>
                      </label>
                      
                      {options.length > 2 && (
                        <button
                          type="button"
                          className="btn-remove-option"
                          onClick={() => removeOption(i)}
                          title="Remove option"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {options.length < 6 && (
              <button
                type="button"
                className="btn btn-outline btn-sm btn-add-option"
                onClick={addOption}
              >
                <span>➕</span> Add Another Option
              </button>
            )}
          </div>

          {/* Explanation */}
          <div className="form-group">
            <label className="form-label">
              Explanation
            </label>
            <textarea
              className="form-textarea"
              placeholder="Explain why this answer is correct..."
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              rows="3"
            />
            <div className="char-counter">
              {explanation.length}/1000 characters
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary btn-icon"
            >
              <span>{isEditing ? '📝' : '➕'}</span>
              {isEditing ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}