import React, { useState } from 'react';

export default function ResultsView({ result, onClose, showComparison = false }) {
  const [expandedQuestions, setExpandedQuestions] = useState({});

  if (!result) return null;

  const toggleQuestion = (index) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const calculateStats = () => {
    const total = result.feedback?.length || 0;
    const correct = result.feedback?.filter(f => f.correct).length || 0;
    const incorrect = total - correct;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return { total, correct, incorrect, percentage };
  };

  const stats = calculateStats();
  const timeTaken = result.duration ? `${Math.floor(result.duration / 60)}m ${result.duration % 60}s` : 'N/A';

  // Calculate performance by difficulty
  const performanceByDifficulty = result.feedback?.reduce((acc, feedback) => {
    const difficulty = feedback.difficulty || 'unknown';
    if (!acc[difficulty]) {
      acc[difficulty] = { total: 0, correct: 0 };
    }
    acc[difficulty].total++;
    if (feedback.correct) {
      acc[difficulty].correct++;
    }
    return acc;
  }, {});

  return (
    <div className="results-container">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quiz Results</h3>
          {onClose && (
            <button className="btn-close" onClick={onClose}>×</button>
          )}
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <div className="score-circle">
            <div className="score-value">{result.score}%</div>
            <div className="score-label">Overall Score</div>
            <div className="score-message">
              {result.score >= 80 ? 'Excellent! 🎉' : 
               result.score >= 60 ? 'Good job! 👍' : 
               'Keep practicing! 💪'}
            </div>
          </div>
          
          <div className="results-stats">
            <div className="stat-item">
              <div className="stat-number correct">{stats.correct}</div>
              <div className="stat-label">Correct</div>
            </div>
            <div className="stat-item">
              <div className="stat-number incorrect">{stats.incorrect}</div>
              <div className="stat-label">Incorrect</div>
            </div>
            <div className="stat-item">
              <div className="stat-number total">{stats.total}</div>
              <div className="stat-label">Total Questions</div>
            </div>
          </div>
        </div>

        {/* Performance Breakdown */}
        {performanceByDifficulty && (
          <div className="performance-breakdown">
            <h4 className="section-title">Performance by Difficulty</h4>
            <div className="difficulty-stats">
              {Object.entries(performanceByDifficulty).map(([difficulty, data]) => (
                <div key={difficulty} className="difficulty-stat">
                  <div className="difficulty-header">
                    <span className={`difficulty-badge difficulty-${difficulty}`}>
                      {difficulty}
                    </span>
                    <span className="difficulty-score">
                      {Math.round((data.correct / data.total) * 100)}%
                    </span>
                  </div>
                  <div className="difficulty-progress">
                    <div 
                      className="difficulty-progress-bar"
                      style={{ width: `${(data.correct / data.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="difficulty-count">
                    {data.correct}/{data.total} correct
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rest of the component remains the same */}
        {/* ... Performance Metrics, Questions Review, Actions ... */}
      </div>
    </div>
  );
}