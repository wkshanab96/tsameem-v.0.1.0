-- Optimize storage structure for better performance
-- This migration ensures we're using the hybrid storage approach correctly

-- Make sure the documents bucket exists
DO $$ 
BEGIN
    -- Check if the bucket already exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'documents'
    ) THEN
        -- Create the bucket if it doesn't exist
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documents', 'documents', true);
    END IF;
    
    -- Make sure the bucket is public
    UPDATE storage.buckets SET public = true WHERE id = 'documents';
END $$;

-- Add index on storage_path to improve query performance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'files' AND indexname = 'idx_files_storage_path'
    ) THEN
        CREATE INDEX idx_files_storage_path ON files(storage_path);
    END IF;
END $$;

-- Add index on public_url to improve query performance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'files' AND indexname = 'idx_files_public_url'
    ) THEN
        CREATE INDEX idx_files_public_url ON files(public_url);
    END IF;
END $$;

-- Add index on folder_id to improve query performance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'files' AND indexname = 'idx_files_folder_id'
    ) THEN
        CREATE INDEX idx_files_folder_id ON files(folder_id);
    END IF;
END $$;

-- Add index on created_by to improve query performance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'files' AND indexname = 'idx_files_created_by'
    ) THEN
        CREATE INDEX idx_files_created_by ON files(created_by);
    END IF;
END $$;

-- Add index on starred to improve query performance for starred items
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'files' AND indexname = 'idx_files_starred'
    ) THEN
        CREATE INDEX idx_files_starred ON files(starred) WHERE starred = true;
    END IF;
END $$;

-- Add index on updated_at to improve query performance for recent items
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'files' AND indexname = 'idx_files_updated_at'
    ) THEN
        CREATE INDEX idx_files_updated_at ON files(updated_at DESC);
    END IF;
END $$;

-- Add similar indexes for folders table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'folders' AND indexname = 'idx_folders_parent_id'
    ) THEN
        CREATE INDEX idx_folders_parent_id ON folders(parent_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'folders' AND indexname = 'idx_folders_created_by'
    ) THEN
        CREATE INDEX idx_folders_created_by ON folders(created_by);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'folders' AND indexname = 'idx_folders_starred'
    ) THEN
        CREATE INDEX idx_folders_starred ON folders(starred) WHERE starred = true;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'folders' AND indexname = 'idx_folders_updated_at'
    ) THEN
        CREATE INDEX idx_folders_updated_at ON folders(updated_at DESC);
    END IF;
END $$;

-- Add index for file_revisions to improve query performance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'file_revisions' AND indexname = 'idx_file_revisions_file_id'
    ) THEN
        CREATE INDEX idx_file_revisions_file_id ON file_revisions(file_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'file_revisions' AND indexname = 'idx_file_revisions_created_at'
    ) THEN
        CREATE INDEX idx_file_revisions_created_at ON file_revisions(created_at DESC);
    END IF;
END $$;

-- Ensure RLS policies are properly set for storage
DO $$ 
BEGIN
    -- Enable RLS on storage tables
    ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Public Access" ON storage.buckets;
    DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.buckets;
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
    
    -- Create policies for buckets
    CREATE POLICY "Public Access" ON storage.buckets
        FOR SELECT
        USING (true);
        
    CREATE POLICY "Allow authenticated uploads" ON storage.buckets
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    
    -- Create policies for objects
    CREATE POLICY "Public Access" ON storage.objects
        FOR SELECT
        USING (bucket_id = 'documents');
        
    CREATE POLICY "Allow authenticated uploads" ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'documents');
        
    CREATE POLICY "Allow authenticated updates" ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'documents' AND (auth.uid() = owner OR owner IS NULL));
        
    CREATE POLICY "Allow authenticated deletes" ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'documents' AND (auth.uid() = owner OR owner IS NULL));
        
END $$;
