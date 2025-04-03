-- Fix folder paths to ensure they start with /My Documents

-- Update root folders to have the correct path
UPDATE folders
SET path = '/My Documents'
WHERE parent_id IS NULL AND name = 'My Documents';

-- Create the create_bucket_if_not_exists function if it doesn't exist
CREATE OR REPLACE FUNCTION create_bucket_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function will be executed by the Supabase service role
  -- It attempts to create the documents bucket if it doesn't exist
  PERFORM supabase_storage.create_bucket('documents', '{"public":true,"fileSizeLimit":52428800}');
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors (bucket might already exist)
    NULL;
END;
$$;
