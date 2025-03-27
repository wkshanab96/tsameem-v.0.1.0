-- Create folders table if it doesn't exist
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id),
  path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  starred BOOLEAN DEFAULT FALSE
);

-- Create files table if it doesn't exist
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  folder_id UUID REFERENCES folders(id),
  path TEXT NOT NULL,
  file_type TEXT,
  size BIGINT,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  starred BOOLEAN DEFAULT FALSE,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  metadata JSONB,
  extracted_text TEXT
);

-- Create file_revisions table if it doesn't exist
CREATE TABLE IF NOT EXISTS file_revisions (
  id UUID PRIMARY KEY,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changes TEXT,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Create functions to create tables if they don't exist
CREATE OR REPLACE FUNCTION create_folders_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'folders') THEN
    CREATE TABLE folders (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id UUID REFERENCES folders(id),
      path TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID NOT NULL,
      starred BOOLEAN DEFAULT FALSE
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_files_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'files') THEN
    CREATE TABLE files (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      folder_id UUID REFERENCES folders(id),
      path TEXT NOT NULL,
      file_type TEXT,
      size BIGINT,
      thumbnail TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID NOT NULL,
      starred BOOLEAN DEFAULT FALSE,
      storage_path TEXT NOT NULL,
      public_url TEXT,
      metadata JSONB,
      extracted_text TEXT
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_file_revisions_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'file_revisions') THEN
    CREATE TABLE file_revisions (
      id UUID PRIMARY KEY,
      file_id UUID REFERENCES files(id) ON DELETE CASCADE,
      version TEXT NOT NULL,
      changes TEXT,
      thumbnail TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID NOT NULL
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_revisions ENABLE ROW LEVEL SECURITY;

-- Create policies for folders
DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own folders" ON folders;
CREATE POLICY "Users can insert their own folders"
  ON folders FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;
CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (created_by = auth.uid());

-- Create policies for files
DROP POLICY IF EXISTS "Users can view their own files" ON files;
CREATE POLICY "Users can view their own files"
  ON files FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own files" ON files;
CREATE POLICY "Users can insert their own files"
  ON files FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own files" ON files;
CREATE POLICY "Users can update their own files"
  ON files FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own files" ON files;
CREATE POLICY "Users can delete their own files"
  ON files FOR DELETE
  USING (created_by = auth.uid());

-- Create policies for file_revisions
DROP POLICY IF EXISTS "Users can view their own file revisions" ON file_revisions;
CREATE POLICY "Users can view their own file revisions"
  ON file_revisions FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own file revisions" ON file_revisions;
CREATE POLICY "Users can insert their own file revisions"
  ON file_revisions FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own file revisions" ON file_revisions;
CREATE POLICY "Users can update their own file revisions"
  ON file_revisions FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own file revisions" ON file_revisions;
CREATE POLICY "Users can delete their own file revisions"
  ON file_revisions FOR DELETE
  USING (created_by = auth.uid());
