import type { SharedUrlInfo } from './types.js';

const GRAPH = 'https://graph.microsoft.com/v1.0';

export class GraphClient {
  constructor(private accessToken: string) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /** Encode a share URL to Graph's shares/{encoded} form. */
  static encodeShareUrl(url: string): string {
    const b64 = Buffer.from(url, 'utf8').toString('base64');
    const encoded = b64.replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
    return `u!${encoded}`;
  }

  /** Resolve a share URL to driveId + itemId. Stub: wire to Graph /shares endpoint. */
  async resolveSharedUrl(url: string): Promise<SharedUrlInfo> {
    const encoded = GraphClient.encodeShareUrl(url);
    const res = await fetch(`${GRAPH}/shares/${encoded}/driveItem`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`graph shares lookup failed: ${res.status} ${await res.text()}`);
    }
    const j = (await res.json()) as {
      id: string;
      name: string;
      parentReference?: { driveId?: string };
    };
    return {
      driveId: j.parentReference?.driveId ?? '',
      itemId: j.id,
      name: j.name,
    };
  }

  async downloadItem(driveId: string, itemId: string): Promise<ArrayBuffer> {
    const res = await fetch(`${GRAPH}/drives/${driveId}/items/${itemId}/content`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`graph download failed: ${res.status} ${await res.text()}`);
    }
    return res.arrayBuffer();
  }
}
