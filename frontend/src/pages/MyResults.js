import React, { useEffect, useState, useMemo } from 'react';
import ResultsView from '../components/ResultsView';

export default function MyResults() {
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('qcm_user_token');

  const subjectName = (subject) => {
    if (!subject) return '';
    if (typeof subject === 'object') return subject.name || '';
    return subject;
  };

  useEffect(() => {
    loadResults();
  }, [token]);

  function loadResults() {
    const userId = localStorage.getItem('qcm_user_id');
    if (!userId) return;
    
    setLoading(true);
    fetch(`/api/results/student/${userId}`, { 
      headers: { Authorization: token ? `Bearer ${token}` : '' } 
    })
      .then(r => r.json())
      .then(d => setResults(d.data || d || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = results.filter(result => {
      const titleText = (result.qcm?.title || '').toString();
      const subjectText = subjectName(result.qcm?.subject || result.qcm?.subject_id);
      const matchesSearch = searchTerm === '' ||
        titleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subjectText.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Prefer explicit `passed` boolean if available, otherwise fallback to score thresholds (60)
      const passedFlag = typeof result.passed !== 'undefined' ? result.passed : (result.score >= 60);
      const matchesFilter = filter === 'all' || 
        (filter === 'passed' && passedFlag) ||
        (filter === 'failed' && !passedFlag);
      
      return matchesSearch && matchesFilter;
    });

    // Sort results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'title':
          aValue = (a.qcm?.title || '').toLowerCase();
          bValue = (b.qcm?.title || '').toLowerCase();
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'date':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    return filtered;
  }, [results, filter, sortBy, sortOrder, searchTerm]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const getPerformanceStats = () => {
    if (results.length === 0) return null;
    
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = (totalScore / results.length).toFixed(1);
  const passedCount = results.filter(r => (typeof r.passed !== 'undefined' ? r.passed : (r.score >= 60))).length;
    const bestScore = Math.max(...results.map(r => r.score));
    const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    return {
      averageScore,
      passedCount,
      totalAttempts: results.length,
      passRate: ((passedCount / results.length) * 100).toFixed(1),
      bestScore,
      totalTime: `${Math.floor(totalTime / 60)}m ${totalTime % 60}s`
    };
  };

  const stats = getPerformanceStats();

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="my-results-container">
      <div className="my-results-card">
        <div className="my-results-header">
          <div className="my-results-header-content">
            <div>
              <h2 className="my-results-title">My Results</h2>
              <p className="my-results-subtitle">Track your learning progress and quiz performance</p>
            </div>
            <button 
              className="btn btn-outline btn-sm"
              onClick={loadResults}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Performance Overview */}
        {stats && (
          <div className="my-results-stats">
            <div className="my-results-stats-grid">
              <div className="my-results-stat-card">
                <div className="my-results-stat-value">{stats.averageScore}%</div>
                <div className="my-results-stat-label">Average Score</div>
              </div>
              <div className="my-results-stat-card">
                <div className="my-results-stat-value">{stats.totalAttempts}</div>
                <div className="my-results-stat-label">Total Attempts</div>
              </div>
              <div className="my-results-stat-card">
                <div className="my-results-stat-value">{stats.passRate}%</div>
                <div className="my-results-stat-label">Pass Rate</div>
              </div>
              <div className="my-results-stat-card">
                <div className="my-results-stat-value">{stats.bestScore}%</div>
                <div className="my-results-stat-label">Best Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="my-results-filters">
          <div className="my-results-search">
            <input
              type="text"
              className="form-input my-results-search-input"
              placeholder="Search by quiz title or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="my-results-filter-controls">
            <select 
              className="form-select my-results-filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Results</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
            
            <select 
              className="form-select my-results-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
              <option value="title">Sort by Title</option>
              <option value="duration">Sort by Duration</option>
            </select>
            
            <button
              className="btn btn-outline btn-sm my-results-sort-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="my-results-body">
          {loading ? (
            <div className="my-results-loading">
              <div className="my-results-spinner"></div>
              <p>Loading your results...</p>
            </div>
          ) : filteredAndSortedResults.length === 0 ? (
            <div className="my-results-empty">
              <div className="my-results-empty-icon">📊</div>
              <h4>No results found</h4>
              <p>
                {searchTerm || filter !== 'all' 
                  ? 'No results match your current filters.' 
                  : 'You haven\'t taken any quizzes yet. Start learning!'}
              </p>
            </div>
          ) : (
            <div className="my-results-content">
              <div className="my-results-table-container">
                <table className="my-results-table">
                  <thead>
                    <tr>
                      <th 
                        className="my-results-sortable"
                        onClick={() => handleSort('title')}
                      >
                        <span>Quiz {getSortIcon('title')}</span>
                      </th>
                      <th 
                        className="my-results-sortable"
                        onClick={() => handleSort('score')}
                      >
                        <span>Score {getSortIcon('score')}</span>
                      </th>
                      <th 
                        className="my-results-sortable"
                        onClick={() => handleSort('date')}
                      >
                        <span>Date {getSortIcon('date')}</span>
                      </th>
                      <th 
                        className="my-results-sortable"
                        onClick={() => handleSort('duration')}
                      >
                        <span>Time {getSortIcon('duration')}</span>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedResults.map(result => (
                      <tr key={result.id} className="my-results-row">
                        <td>
                          <div className="my-results-quiz-info">
                            <strong>{result.qcm?.title || result.qcm_title || 'Quiz'}</strong>
                            {result.qcm?.subject && (
                              <span className="my-results-quiz-subject">{subjectName(result.qcm.subject)}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="my-results-score">
                            <span className={`my-results-score-badge my-results-score-${getScoreColor(result.score)}`}>
                              {result.score}%
                            </span>
                            {(typeof result.passed !== 'undefined' ? result.passed : result.score >= 60) && (
                              <span className="my-results-pass-badge">Passed</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="my-results-date">
                            {new Date(result.created_at).toLocaleDateString()}
                            <div className="my-results-time">
                              {new Date(result.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td>
                          {result.duration ? (
                            <div className="my-results-duration">
                              {Math.floor(result.duration / 60)}m {result.duration % 60}s
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>
                          <div className="my-results-actions">
                            <button 
                              className="btn btn-primary btn-sm my-results-view-btn"
                              onClick={() => setSelectedResult(result)}
                            >
                              View Details
                            </button>
                            {result.qcm?.max_attempts && (
                              <div className="my-results-attempt-info">
                                Attempt {results.filter(r => r.qcm_id === result.qcm_id).indexOf(result) + 1} of {result.qcm.max_attempts}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Results Summary */}
              <div className="my-results-summary">
                <p>
                  Showing {filteredAndSortedResults.length} of {results.length} results
                  {searchTerm && ` for "${searchTerm}"`}
                  {filter !== 'all' && ` (${filter})`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result Detail Modal */}
      {selectedResult && (
        <div className="my-results-modal-overlay">
          <div className="my-results-modal-content">
            <ResultsView 
              result={selectedResult} 
              onClose={() => setSelectedResult(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}