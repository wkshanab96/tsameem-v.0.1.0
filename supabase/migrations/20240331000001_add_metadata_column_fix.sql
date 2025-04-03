-- Add metadata column to files table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'metadata') THEN
        ALTER TABLE files ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END$$;

-- Enable realtime for files table
ALTER PUBLICATION supabase_realtime ADD TABLE files;
