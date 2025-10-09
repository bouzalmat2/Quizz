import React, { useState, useEffect } from 'react';

export default function TakeQuiz({ qcm, onSubmit, onCancel }) {
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(qcm.duration * 60 || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const [startTime] = useState(() => Date.now());

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function select(questionId, index) {
    setAnswers(prev => ({ ...prev, [questionId]: index }));
  }

  async function handleAutoSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // prepare payload including unanswered questions as chosen_option: null
    const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
    const payload = (qcm.questions || []).map(q => {
      const chosenIndex = answers[q.id];
      const chosenText = (typeof chosenIndex !== 'undefined' && Array.isArray(q.options)) ? q.options[chosenIndex] : null;
      return { question_id: q.id, chosen_option: chosenText };
    });

    try {
      // onSubmit may return a promise (StudentQcms.submit will). Await it so we can clear submitting state.
  const maybePromise = onSubmit(payload, true, elapsed);
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
      }
    } catch (e) {
      // swallow - parent will show toast
      console.error('Auto-submit failed', e);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const unanswered = qcm.questions.filter(q => answers[q.id] === undefined);
    if (unanswered.length > 0 && !window.confirm(
      `You have ${unanswered.length} unanswered question${unanswered.length > 1 ? 's' : ''}. Submit anyway?`
    )) {
      setIsSubmitting(false);
      return;
    }

    const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
    const payload = (qcm.questions || []).map(q => {
      const chosenIndex = answers[q.id];
      const chosenText = (typeof chosenIndex !== 'undefined' && Array.isArray(q.options)) ? q.options[chosenIndex] : null;
      return { question_id: q.id, chosen_option: chosenText };
    });

    try {
  const maybePromise = onSubmit(payload, false, elapsed);
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
      }
    } catch (err) {
      console.error('Submit failed', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (Object.keys(answers).length / (qcm.questions?.length || 1)) * 100;
  const unansweredCount = (qcm.questions?.length || 0) - Object.keys(answers).length;

  const nextQuestion = () => {
    setCurrentQuestion(prev => {
      const next = Math.min(prev + 1, (qcm.questions?.length || 1) - 1);
      setVisitedQuestions(prevVisited => new Set([...prevVisited, next]));
      return next;
    });
  };

  const prevQuestion = () => {
    setCurrentQuestion(prev => {
      const previous = Math.max(prev - 1, 0);
      setVisitedQuestions(prevVisited => new Set([...prevVisited, previous]));
      return previous;
    });
  };

  const goToQuestion = (index) => {
    setCurrentQuestion(index);
    setVisitedQuestions(prevVisited => new Set([...prevVisited, index]));
  };

  const currentQ = qcm.questions?.[currentQuestion];

  return (
    <div className="quiz-container-wide">
      <div className="quiz-card-wide">
        {/* Quiz Header - Fixed */}
        <div className="quiz-header-wide">
          <div className="quiz-title-section-wide">
            <h2 className="quiz-title-wide">{qcm.title}</h2>
            <div className="quiz-meta-wide">
              {qcm.subject && <span className="quiz-subject-wide">{(qcm.subject && qcm.subject.name) ? qcm.subject.name : qcm.subject}</span>}
              <div className="time-remaining-wide">
                <span className="time-icon">⏱️</span>
                <span className="time-text">{formatTime(timeLeft)}</span>
                {timeLeft < 300 && <span className="time-warning">Hurry!</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - No Horizontal Scrolling */}
        <div className="quiz-content-wide">
          {/* Left Side - Progress & Navigation */}
          <div className="sidebar-wide">
            {/* Progress */}
            <div className="progress-section-wide">
              <div className="progress-header-wide">
                <span>Progress</span>
                <span className="progress-count">{Object.keys(answers).length}/{qcm.questions?.length || 0}</span>
              </div>
              <div className="progress-bar-wide">
                <div className="progress-fill-wide" style={{ width: `${progress}%` }}></div>
              </div>
              {unansweredCount > 0 && (
                <div className="unanswered-warning-wide">{unansweredCount} unanswered</div>
              )}
            </div>

            {/* Question Navigation */}
            <div className="navigation-section-wide">
              <h4>Questions</h4>
              <div className="question-dots-wide">
                {qcm.questions?.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`dot-wide ${index === currentQuestion ? 'active' : ''} ${
                      answers[qcm.questions[index].id] !== undefined ? 'answered' : 
                      visitedQuestions.has(index) ? 'visited' : 'unvisited'
                    }`}
                    onClick={() => goToQuestion(index)}
                    title={`Question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="actions-section-wide">
              <button
                type="button"
                className="btn-nav-wide"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                ← Previous
              </button>
              <span className="question-counter-wide">
                {currentQuestion + 1} of {qcm.questions?.length || 0}
              </span>
              <button
                type="button"
                className="btn-nav-wide"
                onClick={nextQuestion}
                disabled={currentQuestion === (qcm.questions?.length || 1) - 1}
              >
                Next →
              </button>
            </div>
          </div>

          {/* Right Side - Question & Options */}
          <div className="main-content-wide">
            <form onSubmit={submit} className="quiz-form-wide">
              {currentQ && (
                <div className="question-section-wide">
                  {/* Question */}
                  <div className="question-header-wide">
                    <h3 className="question-text-wide">
                      <span className="question-number-wide">Q{currentQuestion + 1}.</span>
                      {currentQ.text}
                    </h3>
                    {currentQ.imageUrl && (
                      <div className="question-image-wide">
                        <img src={currentQ.imageUrl} alt="Question illustration" />
                      </div>
                    )}
                  </div>

                  {/* Options - Full Width */}
                  <div className="options-section-wide">
                    <div className="options-grid-wide">
                      {(currentQ.options || []).map((opt, i) => (
                        <label 
                          key={i} 
                          className={`option-label-wide ${
                            answers[currentQ.id] === i ? 'selected' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${currentQ.id}`}
                            checked={answers[currentQ.id] === i}
                            onChange={() => select(currentQ.id, i)}
                            className="option-radio-wide"
                          />
                          <span className="option-marker-wide">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="option-text-wide">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Answer Status */}
                  {answers[currentQ.id] !== undefined && (
                    <div className="answer-status-wide">
                      ✓ Answer selected
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer - Submit Actions */}
        <div className="quiz-footer-wide">
          <div className="footer-actions-wide">
            <button
              type="button"
              className="btn btn-outline-wide"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel Quiz
            </button>
            
            <div className="submit-group-wide">
              <div className="submit-info-wide">
                {unansweredCount > 0 ? (
                  <span className="warning-text">
                    {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered
                  </span>
                ) : (
                  <span className="success-text">
                    All questions answered ✓
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-success-wide"
                onClick={submit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Submit Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}