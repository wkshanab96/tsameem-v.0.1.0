-- Add metadata and extracted_text columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE files ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Add processed flag to track processing status
ALTER TABLE files ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;

-- Enable full-text search on extracted_text
ALTER TABLE files ADD COLUMN IF NOT EXISTS text_search_vector tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(extracted_text, ''))) STORED;

-- Create index for faster full-text search
CREATE INDEX IF NOT EXISTS files_text_search_idx ON files USING GIN (text_search_vector);

-- Add the table to realtime publication if not already added
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'files'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE files;
  END IF;
END
$;
