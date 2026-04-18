import { getDb, clients, clientAliases, projects } from '@vcl/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Next 15: `params` is a Promise in route components.
export default async function ClientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const [c] = await db.select().from(clients).where(eq(clients.id, id));
  if (!c) notFound();
  const aliases = await db.select().from(clientAliases).where(eq(clientAliases.clientId, id));
  const cProjects = await db.select().from(projects).where(eq(projects.clientId, id));
  return (
    <div>
      <h1>{c.name}</h1>
      <div className="card">
        <div>Domain: {c.domain ?? '—'}</div>
        <div>Country: {c.country ?? '—'}</div>
        <div>Industry: {c.industry ?? '—'}</div>
      </div>
      <h2>Aliases</h2>
      <ul>{aliases.map((a) => <li key={a.id}>{a.alias}</li>)}</ul>
      <h2>Projects</h2>
      <ul>{cProjects.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
    </div>
  );
}
