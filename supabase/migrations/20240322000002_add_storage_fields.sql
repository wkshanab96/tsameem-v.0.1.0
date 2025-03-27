-- Add storage_path and public_url columns to files table
ALTER TABLE files
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS public_url TEXT;

-- Create storage bucket if it doesn't exist
CREATE OR REPLACE FUNCTION create_bucket_if_not_exists()
RETURNS void AS $$
BEGIN
  -- This function is a placeholder. The actual bucket creation will be handled by the application code
  -- using the Supabase client, as it's not possible to create buckets directly from SQL.
  RETURN;
END;
$$ LANGUAGE plpgsql;

SELECT create_bucket_if_not_exists();
