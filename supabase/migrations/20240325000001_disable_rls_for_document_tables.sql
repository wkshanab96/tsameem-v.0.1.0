-- Disable RLS for folders table
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;

-- Disable RLS for files table
ALTER TABLE files DISABLE ROW LEVEL SECURITY;

-- Disable RLS for file_revisions table
ALTER TABLE file_revisions DISABLE ROW LEVEL SECURITY;
