import { getDb, clientReviews } from '@vcl/db';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const db = getDb();
  const pending = await db
    .select()
    .from(clientReviews)
    .where(eq(clientReviews.status, 'pending'))
    .orderBy(desc(clientReviews.createdAt));

  return (
    <div>
      <h1>Client review queue</h1>
      {pending.length === 0 && <p>Nothing pending.</p>}
      {pending.map((r) => (
        <div key={r.id} className="card">
          <h2>{r.candidateName}</h2>
          <div style={{ fontSize: 13, color: '#9aa' }}>
            Normalized: <code>{r.normalizedCandidate}</code>
          </div>
          <h2>Possible matches</h2>
          <table>
            <thead><tr><th>Existing client</th><th>Score</th><th>Action</th></tr></thead>
            <tbody>
              {r.matches.map((m) => (
                <tr key={m.clientId}>
                  <td>{m.name}</td>
                  <td>{m.score.toFixed(2)}</td>
                  <td>
                    <form action={`/api/review/${r.id}/merge`} method="post">
                      <input type="hidden" name="clientId" value={m.clientId} />
                      <button type="submit">Merge</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <form action={`/api/review/${r.id}/approve-new`} method="post">
              <button type="submit">Create new client</button>
            </form>
            <form action={`/api/review/${r.id}/reject`} method="post">
              <button type="submit">Reject</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
