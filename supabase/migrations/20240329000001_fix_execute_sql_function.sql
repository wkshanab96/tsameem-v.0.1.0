-- Create the execute_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;

-- Add metadata column to files table if it doesn't exist
ALTER TABLE IF EXISTS files ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
