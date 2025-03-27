export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  starred: boolean;
}

export interface File {
  id: string;
  name: string;
  folder_id: string;
  path: string;
  file_type: string;
  size: number;
  thumbnail: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  starred: boolean;
  revisions?: FileRevision[];
  metadata?: Record<string, any>;
  extractedText?: string;
}

export interface FileRevision {
  id: string;
  file_id: string;
  version: string;
  changes: string;
  thumbnail: string;
  created_at: string;
  created_by: string;
}
