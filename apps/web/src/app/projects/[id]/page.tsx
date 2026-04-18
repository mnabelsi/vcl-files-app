import { getDb, projects, proposals } from '@vcl/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const [p] = await db.select().from(projects).where(eq(projects.id, id));
  if (!p) notFound();
  const props = await db.select().from(proposals).where(eq(proposals.projectId, id));
  return (
    <div>
      <h1>{p.name}</h1>
      <div className="card">
        <div>Year: {p.year ?? '—'}</div>
        <div>Status: {p.status ?? '—'}</div>
        <div>Summary: {p.summary ?? '—'}</div>
      </div>
      <h2>Proposals</h2>
      <ul>
        {props.map((pr) => (
          <li key={pr.id}>
            {pr.title} {pr.costEstimate ? `— ${pr.costEstimate} ${pr.currency ?? ''}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
