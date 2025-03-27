-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS TABLE(column_exists boolean) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = check_column_exists.table_name
    AND column_name = check_column_exists.column_name
  );
END;
$$ LANGUAGE plpgsql;

-- Function to add a column if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(table_name text, column_name text, column_type text)
RETURNS void SECURITY DEFINER AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = add_column_if_not_exists.table_name
    AND column_name = add_column_if_not_exists.column_name
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', table_name, column_name, column_type);
  END IF;
END;
$$ LANGUAGE plpgsql;
