-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id),
  path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  starred BOOLEAN DEFAULT FALSE
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  folder_id UUID REFERENCES folders(id),
  path TEXT NOT NULL,
  file_type TEXT,
  size BIGINT,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  starred BOOLEAN DEFAULT FALSE
);

-- Create file revisions table
CREATE TABLE IF NOT EXISTS file_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changes TEXT,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_revisions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
CREATE POLICY "Users can view their own folders"
  ON folders
  FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own folders" ON folders;
CREATE POLICY "Users can insert their own folders"
  ON folders
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
CREATE POLICY "Users can update their own folders"
  ON folders
  FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;
CREATE POLICY "Users can delete their own folders"
  ON folders
  FOR DELETE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can view their own files" ON files;
CREATE POLICY "Users can view their own files"
  ON files
  FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own files" ON files;
CREATE POLICY "Users can insert their own files"
  ON files
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own files" ON files;
CREATE POLICY "Users can update their own files"
  ON files
  FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own files" ON files;
CREATE POLICY "Users can delete their own files"
  ON files
  FOR DELETE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can view their own file revisions" ON file_revisions;
CREATE POLICY "Users can view their own file revisions"
  ON file_revisions
  FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own file revisions" ON file_revisions;
CREATE POLICY "Users can insert their own file revisions"
  ON file_revisions
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Enable realtime
alter publication supabase_realtime add table folders;
alter publication supabase_realtime add table files;
alter publication supabase_realtime add table file_revisions;

-- Create root folder for each user function
CREATE OR REPLACE FUNCTION create_root_folder_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO folders (name, path, created_by)
  VALUES ('My Documents', '/My Documents', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create root folder when user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_root_folder_for_user();
