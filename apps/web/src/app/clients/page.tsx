import { getDb, clients } from '@vcl/db';
import { asc } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const rows = await getDb().select().from(clients).orderBy(asc(clients.name));
  return (
    <div>
      <h1>Clients</h1>
      {rows.length === 0 && <p>No clients yet.</p>}
      <table>
        <thead><tr><th>Name</th><th>Domain</th><th>Country</th><th>Industry</th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td><Link href={`/clients/${c.id}`}>{c.name}</Link></td>
              <td>{c.domain ?? ''}</td>
              <td>{c.country ?? ''}</td>
              <td>{c.industry ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
