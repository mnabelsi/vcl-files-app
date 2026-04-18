import type { DeltaPage, DriveItem } from './types.js';

const GRAPH = 'https://graph.microsoft.com/v1.0';

/**
 * Incremental folder-scoped delta sync. If `deltaLink` is null, start from the
 * beginning for the given root item. Returns one page + next link.
 *
 * STUB: signature + request shape are real; returns empty page until wired.
 */
export async function fetchDeltaPage(args: {
  accessToken: string;
  driveId: string;
  rootItemId?: string;
  deltaOrNextLink?: string;
}): Promise<DeltaPage> {
  const url =
    args.deltaOrNextLink ??
    (args.rootItemId
      ? `${GRAPH}/drives/${args.driveId}/items/${args.rootItemId}/delta`
      : `${GRAPH}/drives/${args.driveId}/root/delta`);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${args.accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`graph delta failed: ${res.status} ${await res.text()}`);
  }
  const j = (await res.json()) as {
    value?: Array<Record<string, unknown>>;
    '@odata.nextLink'?: string;
    '@odata.deltaLink'?: string;
  };

  const items: DriveItem[] = (j.value ?? []).map((v) => {
    const item = v as {
      id: string;
      name: string;
      size?: number;
      eTag?: string;
      file?: { mimeType?: string; hashes?: { sha1Hash?: string; quickXorHash?: string } };
      folder?: unknown;
      deleted?: unknown;
      lastModifiedDateTime?: string;
      parentReference?: { driveId?: string; path?: string };
    };
    return {
      id: item.id,
      driveId: item.parentReference?.driveId ?? args.driveId,
      name: item.name,
      parentPath: item.parentReference?.path,
      size: item.size,
      mimeType: item.file?.mimeType,
      eTag: item.eTag,
      hash: item.file?.hashes?.sha1Hash ?? item.file?.hashes?.quickXorHash,
      lastModifiedDateTime: item.lastModifiedDateTime,
      folder: !!item.folder,
      deleted: !!item.deleted,
    };
  });

  return {
    items,
    nextLink: j['@odata.nextLink'],
    deltaLink: j['@odata.deltaLink'],
  };
}
