-- Add extracted_text column to files table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'extracted_text') THEN
        ALTER TABLE files ADD COLUMN extracted_text TEXT;
    END IF;
END
$$;
