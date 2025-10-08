import React, { useState } from 'react';

export default function TakeQuiz({ qcm, onSubmit, onCancel }) {
  const [answers, setAnswers] = useState({});

  function select(questionId, index) {
    setAnswers(prev => ({ ...prev, [questionId]: index }));
  }

  function submit(e) {
    e.preventDefault();
    // convert to expected payload [{question_id, chosen_option}]
    const payload = Object.keys(answers).map(k => ({ question_id: parseInt(k, 10), chosen_option: answers[k] }));
    onSubmit(payload);
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 12 }}>
      <h3>{qcm.title}</h3>
      <form onSubmit={submit}>
        {(qcm.questions || []).map(q => (
          <div key={q.id} style={{ marginBottom: 8 }}>
            <div>{q.text}</div>
            <div>
              {(q.options || []).map((opt, i) => (
                <label key={i} style={{ display: 'block' }}>
                  <input type="radio" name={`q_${q.id}`} checked={answers[q.id] === i} onChange={() => select(q.id, i)} /> {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
        <div>
          <button type="submit">Submit Answers</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
