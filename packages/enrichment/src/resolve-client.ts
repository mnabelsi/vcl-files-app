import { sql } from 'drizzle-orm';
import { getDb, clients, clientAliases, normalizeClientName } from '@vcl/db';

export const MERGE_THRESHOLD = 0.85;
export const REVIEW_THRESHOLD = 0.6;

export type ResolutionDecision =
  | { kind: 'merge'; clientId: string; score: number }
  | { kind: 'review'; candidates: Array<{ clientId: string; name: string; score: number }> }
  | { kind: 'new' };

/**
 * Fuzzy-match a candidate client name against existing clients + aliases using
 * pg_trgm similarity. Thresholds follow the agreed policy.
 */
export async function resolveCandidate(
  candidateName: string,
): Promise<ResolutionDecision> {
  const db = getDb();
  const norm = normalizeClientName(candidateName);

  const rows = (await db.execute(sql`
    SELECT id, name, similarity(${norm}, normalized_name) AS score
    FROM ${clients}
    WHERE ${norm} % normalized_name
    UNION ALL
    SELECT c.id, c.name, similarity(${norm}, ca.normalized_alias) AS score
    FROM ${clientAliases} ca
    JOIN ${clients} c ON c.id = ca.client_id
    WHERE ${norm} % ca.normalized_alias
    ORDER BY score DESC
    LIMIT 5
  `)) as unknown as Array<{ id: string; name: string; score: number }>;

  const top = rows[0];
  if (!top) return { kind: 'new' };
  if (top.score >= MERGE_THRESHOLD) {
    return { kind: 'merge', clientId: top.id, score: top.score };
  }
  if (top.score >= REVIEW_THRESHOLD) {
    return {
      kind: 'review',
      candidates: rows.map((r) => ({ clientId: r.id, name: r.name, score: r.score })),
    };
  }
  return { kind: 'new' };
}
