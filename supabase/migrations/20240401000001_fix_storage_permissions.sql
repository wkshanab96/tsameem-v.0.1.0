-- Fix storage permissions for public access

-- Enable row level security on storage.buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Enable row level security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access to the documents bucket
DROP POLICY IF EXISTS "Public Access" ON storage.buckets;
CREATE POLICY "Public Access" ON storage.buckets
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated users to insert into the documents bucket
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.buckets;
CREATE POLICY "Allow authenticated uploads" ON storage.buckets
  FOR INSERT
  TO authenticated
  USING (true);

-- Create policy to allow public access to objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents');

-- Create policy to allow authenticated users to insert objects
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Create policy to allow authenticated users to update their own objects
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid() = owner OR owner IS NULL));

-- Create policy to allow authenticated users to delete their own objects
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid() = owner OR owner IS NULL));

-- Make sure the documents bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;
