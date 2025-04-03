-- Create app_secrets table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert or update the N8N_AUTH_TOKEN
INSERT INTO app_secrets (name, value)
VALUES ('N8N_AUTH_TOKEN', 'n8n_' || substr(md5(random()::text), 1, 10) || '_' || extract(epoch from now())::text)
ON CONFLICT (name) 
DO UPDATE SET value = 'n8n_' || substr(md5(random()::text), 1, 10) || '_' || extract(epoch from now())::text, updated_at = NOW();

-- Enable realtime for app_secrets table
ALTER PUBLICATION supabase_realtime ADD TABLE app_secrets;
