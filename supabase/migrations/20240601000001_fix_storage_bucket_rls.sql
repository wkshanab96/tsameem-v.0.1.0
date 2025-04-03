-- This migration fixes the RLS policies for storage buckets and objects

-- First, ensure RLS is enabled on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Public Access" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.buckets;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Create policy to allow public access to buckets
CREATE POLICY "Public Access" ON storage.buckets
  FOR SELECT
  USING (true);

-- Create policy to allow service role to manage buckets
CREATE POLICY "Allow service role full access" ON storage.buckets
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create policy to allow authenticated users to insert into buckets
CREATE POLICY "Allow authenticated uploads" ON storage.buckets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow public access to objects
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (true);

-- Create policy to allow service role to manage objects
CREATE POLICY "Allow service role full access" ON storage.objects
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create policy to allow authenticated users to insert objects
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update their own objects
CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner OR owner IS NULL OR auth.role() = 'service_role');

-- Create policy to allow authenticated users to delete their own objects
CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner OR owner IS NULL OR auth.role() = 'service_role');

-- Create RPC function to create bucket if it doesn't exist (with service_role permissions)
CREATE OR REPLACE FUNCTION create_bucket_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This ensures the function runs with the privileges of the creator
AS $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', true)
  ON CONFLICT (id) DO NOTHING;
 END;
$$;
