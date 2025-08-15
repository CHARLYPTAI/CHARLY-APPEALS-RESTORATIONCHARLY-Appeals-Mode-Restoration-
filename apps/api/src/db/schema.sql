-- Database schema with Row Level Security for tenant isolation
-- This ensures complete data separation between RESIDENTIAL and COMMERCIAL tenants

-- Enable RLS extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenant types enum
CREATE TYPE tenant_type AS ENUM ('RESIDENTIAL', 'COMMERCIAL');

-- Users table with tenant isolation
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tenant_type tenant_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY users_tenant_isolation ON users
    FOR ALL
    USING (tenant_type = current_setting('app.current_tenant_type')::tenant_type);

-- Commercial properties table (existing structure with tenant isolation)
CREATE TABLE commercial_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_type tenant_type NOT NULL DEFAULT 'COMMERCIAL',
    user_id UUID NOT NULL REFERENCES users(id),
    property_address TEXT NOT NULL,
    assessed_value DECIMAL(15,2),
    market_value DECIMAL(15,2),
    jurisdiction VARCHAR(100),
    tax_year INTEGER,
    property_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT commercial_properties_tenant_check CHECK (tenant_type = 'COMMERCIAL')
);

-- Enable RLS on commercial properties
ALTER TABLE commercial_properties ENABLE ROW LEVEL SECURITY;

-- RLS policies for commercial properties
CREATE POLICY commercial_properties_tenant_isolation ON commercial_properties
    FOR ALL
    USING (
        tenant_type = current_setting('app.current_tenant_type')::tenant_type
        AND tenant_type = 'COMMERCIAL'
        AND user_id = current_setting('app.current_user_id')::UUID
    );

-- Residential properties table (new for Phase 2, but schema ready)
CREATE TABLE residential_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_type tenant_type NOT NULL DEFAULT 'RESIDENTIAL',
    user_id UUID NOT NULL REFERENCES users(id),
    property_address TEXT NOT NULL,
    assessed_value DECIMAL(15,2),
    market_value DECIMAL(15,2),
    jurisdiction VARCHAR(100),
    tax_year INTEGER,
    homestead_exemption BOOLEAN DEFAULT FALSE,
    square_footage INTEGER,
    lot_size DECIMAL(10,2),
    year_built INTEGER,
    property_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT residential_properties_tenant_check CHECK (tenant_type = 'RESIDENTIAL')
);

-- Enable RLS on residential properties
ALTER TABLE residential_properties ENABLE ROW LEVEL SECURITY;

-- RLS policies for residential properties
CREATE POLICY residential_properties_tenant_isolation ON residential_properties
    FOR ALL
    USING (
        tenant_type = current_setting('app.current_tenant_type')::tenant_type
        AND tenant_type = 'RESIDENTIAL'
        AND user_id = current_setting('app.current_user_id')::UUID
    );

-- Appeals table with tenant isolation
CREATE TABLE appeals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_type tenant_type NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    property_id UUID NOT NULL,
    appeal_status VARCHAR(50) DEFAULT 'draft',
    filing_deadline DATE,
    narrative_text TEXT,
    appeal_packet_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on appeals
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;

-- RLS policies for appeals
CREATE POLICY appeals_tenant_isolation ON appeals
    FOR ALL
    USING (
        tenant_type = current_setting('app.current_tenant_type')::tenant_type
        AND user_id = current_setting('app.current_user_id')::UUID
    );

-- Add foreign key constraints based on tenant type
ALTER TABLE appeals 
ADD CONSTRAINT appeals_commercial_property_fk 
FOREIGN KEY (property_id) REFERENCES commercial_properties(id) 
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE appeals 
ADD CONSTRAINT appeals_residential_property_fk 
FOREIGN KEY (property_id) REFERENCES residential_properties(id) 
DEFERRABLE INITIALLY DEFERRED;

-- Create function to set session variables for RLS
CREATE OR REPLACE FUNCTION set_session_tenant(p_tenant_type tenant_type, p_user_id UUID)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant_type', p_tenant_type::text, true);
    PERFORM set_config('app.current_user_id', p_user_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX idx_users_tenant_type ON users(tenant_type);
CREATE INDEX idx_users_email_tenant ON users(email, tenant_type);
CREATE INDEX idx_commercial_properties_user_tenant ON commercial_properties(user_id, tenant_type);
CREATE INDEX idx_residential_properties_user_tenant ON residential_properties(user_id, tenant_type);
CREATE INDEX idx_appeals_user_tenant ON appeals(user_id, tenant_type);

-- Create seed data for development/testing
INSERT INTO users (email, password_hash, tenant_type) VALUES 
('demo@example.com', '$2b$10$rOe.0QJiZ9o5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'COMMERCIAL'),
('demo@example.com', '$2b$10$rOe.0QJiZ9o5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'RESIDENTIAL')
ON CONFLICT (email) DO NOTHING;