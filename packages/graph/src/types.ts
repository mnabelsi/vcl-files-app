export interface DriveItem {
  id: string;
  driveId: string;
  name: string;
  parentPath?: string;
  size?: number;
  mimeType?: string;
  eTag?: string;
  hash?: string; // quickXor / sha1 / sha256 from Graph
  lastModifiedDateTime?: string;
  deleted?: boolean;
  folder?: boolean;
}

export interface DeltaPage {
  items: DriveItem[];
  deltaLink?: string;
  nextLink?: string;
}

export interface SharedUrlInfo {
  driveId: string;
  itemId: string;
  name: string;
}
