import { getDb, projects } from '@vcl/db';
import { desc } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const rows = await getDb().select().from(projects).orderBy(desc(projects.createdAt));
  return (
    <div>
      <h1>Projects</h1>
      <table>
        <thead><tr><th>Name</th><th>Year</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td><Link href={`/projects/${p.id}`}>{p.name}</Link></td>
              <td>{p.year ?? ''}</td>
              <td>{p.status ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
