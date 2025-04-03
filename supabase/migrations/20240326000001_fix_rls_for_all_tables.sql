-- Disable RLS for all document-related tables
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_revisions DISABLE ROW LEVEL SECURITY;

-- Ensure storage.objects table has RLS disabled (this is where file uploads go)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Create public policies for storage buckets and objects
DROP POLICY IF EXISTS "Public access to buckets" ON storage.buckets;
CREATE POLICY "Public access to buckets"
  ON storage.buckets
  FOR ALL
  USING (true);

DROP POLICY IF EXISTS "Public access to objects" ON storage.objects;
CREATE POLICY "Public access to objects"
  ON storage.objects
  FOR ALL
  USING (true);

-- Ensure the documents bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Grant necessary permissions to authenticated users
GRANT ALL ON TABLE folders TO authenticated;
GRANT ALL ON TABLE files TO authenticated;
GRANT ALL ON TABLE file_revisions TO authenticated;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.buckets TO authenticated;
