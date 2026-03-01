-- Add password field to servers table
ALTER TABLE servers ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Add comment
COMMENT ON COLUMN servers.password IS 'Optional password for server access protection';
