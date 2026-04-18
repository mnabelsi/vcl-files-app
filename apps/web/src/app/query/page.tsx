'use client';
import { useState } from 'react';

export default function QueryPage() {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAnswer('');
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q }),
    });
    const j = (await res.json()) as { answer: string };
    setAnswer(j.answer);
    setLoading(false);
  }

  return (
    <div>
      <h1>Query</h1>
      <form onSubmit={ask} className="card" style={{ display: 'grid', gap: 8 }}>
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          placeholder="Find a case study like..."
        />
        <button type="submit" disabled={loading || !q.trim()}>
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </form>
      {answer && (
        <div className="card">
          <h2>Answer</h2>
          <div style={{ whiteSpace: 'pre-wrap' }}>{answer}</div>
        </div>
      )}
    </div>
  );
}
