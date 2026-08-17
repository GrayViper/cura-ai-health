-- MySQL initialization script for HAPI FHIR
-- Creates necessary tables and initial data

-- Use the HAPI FHIR database
USE hapi_fhir;

-- Create initial indexes for performance
CREATE INDEX idx_resource_type ON hfj_resource(res_type);
CREATE INDEX idx_res_id ON hfj_resource(res_id);
CREATE INDEX idx_deleted_at ON hfj_resource(deleted_at);

-- Grant privileges to HAPI user
GRANT ALL PRIVILEGES ON hapi_fhir.* TO 'hapi_user'@'%';
FLUSH PRIVILEGES;

-- Log initialization
SELECT "HAPI FHIR database initialized successfully" AS status;
