import { getDb, syncJobs, files } from '@vcl/db';
import { desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function SyncPage() {
  const db = getDb();
  const jobs = await db.select().from(syncJobs).orderBy(desc(syncJobs.createdAt)).limit(20);
  const counts = await db.execute(sql`
    SELECT status, count(*)::int AS n FROM ${files} GROUP BY status
  `) as unknown as Array<{ status: string; n: number }>;
  return (
    <div>
      <h1>Sync</h1>
      <div className="card">
        <h2>Files by status</h2>
        <table>
          <thead><tr><th>Status</th><th>Count</th></tr></thead>
          <tbody>
            {counts.map((c) => (
              <tr key={c.status}><td>{c.status}</td><td>{c.n}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h2>Recent jobs</h2>
        <table>
          <thead><tr><th>Kind</th><th>Status</th><th>Started</th><th>Error</th></tr></thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>{j.kind}</td>
                <td>{j.status}</td>
                <td>{j.startedAt ? new Date(j.startedAt).toLocaleString() : '—'}</td>
                <td>{j.error ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
