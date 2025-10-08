import React, { useEffect, useState } from 'react';
import TakeQuiz from '../components/TakeQuiz';

export default function StudentQcms() {
  const [qcms, setQcms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingQcm, setLoadingQcm] = useState(false);
  const [history, setHistory] = useState([]);
  const token = localStorage.getItem('qcm_user_token');

  useEffect(() => {
    fetch('/api/qcms', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then(r => r.json())
      .then(data => {
        const list = data?.data || data || [];
        setQcms(list.filter(q => q.published));
      })
      .catch(console.error);

    const userId = localStorage.getItem('qcm_user_id');
    if (userId) {
      fetch(`/api/results/student/${userId}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
        .then(r => r.json())
        .then(d => setHistory(d.data || d || []))
        .catch(console.error);
    }
  }, [token]);

  function submit(qcmId, answers) {
    fetch(`/api/qcms/${qcmId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ answers }),
    })
      .then(r => r.json())
      .then(result => {
        alert('Score: ' + (result.score ?? JSON.stringify(result)));
        // reload history
        const userId = localStorage.getItem('qcm_user_id');
        if (userId) {
          fetch(`/api/results/student/${userId}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
            .then(r => r.json())
            .then(d => setHistory(d.data || d || []))
            .catch(console.error);
        }
      })
      .catch(console.error);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Available QCMs</h2>
      <ul>
        {qcms.map(q => (
          <li key={q.id} style={{ marginBottom: 10 }}>
            <strong>{q.title}</strong> — {q.subject}
            <div>
              <button onClick={() => {
                // fetch full qcm details (including questions) before starting
                setLoadingQcm(true);
                fetch(`/api/qcms/${q.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
                  .then(r => r.json())
                  .then(full => setSelected(full))
                  .catch(console.error)
                  .finally(() => setLoadingQcm(false));
              }} disabled={loadingQcm}>{loadingQcm ? 'Loading...' : 'Take Quiz'}</button>
            </div>
          </li>
        ))}
      </ul>

      {selected && <TakeQuiz qcm={selected} onSubmit={(answers) => submit(selected.id, answers)} onCancel={() => setSelected(null)} />}

      <h3>Your History</h3>
      <ul>
        {history.map(h => (
          <li key={h.id}>
            QCM {h.qcm_id} — Score: {h.score}% — {new Date(h.created_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
