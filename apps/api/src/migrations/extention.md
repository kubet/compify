-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Create the indexes
CREATE INDEX IF NOT EXISTS idx_component_name_trgm
ON component
USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_component_name_visibility
ON component(name, visibility);

CREATE INDEX IF NOT EXISTS idx_component_frameworks
ON component
USING gin ("usedUiFrameworks");
