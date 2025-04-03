-- Function to execute arbitrary SQL (admin only)
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void SECURITY DEFINER AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql;
