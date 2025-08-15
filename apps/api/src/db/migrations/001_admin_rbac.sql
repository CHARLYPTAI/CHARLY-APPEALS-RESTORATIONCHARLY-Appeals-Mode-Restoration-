-- Migration: Add admin RBAC tables and audit logging
-- Created: 2025-08-15
-- Purpose: Phase 3 C1a - Admin panel foundation with RBAC and audit

-- Admin role types
CREATE TYPE admin_role AS ENUM ('superadmin', 'tenant_admin', 'auditor');

-- Role assignments table
CREATE TABLE role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role admin_role NOT NULL,
    tenant_type tenant_type NULL, -- Only set for tenant_admin
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT role_assignments_tenant_admin_check 
        CHECK ((role = 'tenant_admin' AND tenant_type IS NOT NULL) OR 
               (role != 'tenant_admin' AND tenant_type IS NULL)),
    CONSTRAINT role_assignments_unique_active 
        UNIQUE (user_id, role, tenant_type) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS on role_assignments
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policy for role_assignments - superadmin can see all, tenant_admin can see own tenant
CREATE POLICY role_assignments_access ON role_assignments
    FOR ALL
    USING (
        -- Superadmin can see everything
        EXISTS (
            SELECT 1 FROM role_assignments ra 
            WHERE ra.user_id = current_setting('app.current_user_id')::UUID 
            AND ra.role = 'superadmin' 
            AND ra.revoked_at IS NULL
        )
        OR
        -- Tenant admin can see assignments in their tenant
        (
            EXISTS (
                SELECT 1 FROM role_assignments ra 
                WHERE ra.user_id = current_setting('app.current_user_id')::UUID 
                AND ra.role = 'tenant_admin' 
                AND ra.tenant_type = current_setting('app.current_tenant_type')::tenant_type
                AND ra.revoked_at IS NULL
            )
            AND (tenant_type = current_setting('app.current_tenant_type')::tenant_type OR tenant_type IS NULL)
        )
        OR
        -- Auditor can see assignments they can audit
        (
            EXISTS (
                SELECT 1 FROM role_assignments ra 
                WHERE ra.user_id = current_setting('app.current_user_id')::UUID 
                AND ra.role = 'auditor' 
                AND ra.revoked_at IS NULL
            )
        )
    );

-- Rule templates table
CREATE TABLE rule_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    tenant_type tenant_type NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    schema_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT rule_templates_name_version_tenant_unique 
        UNIQUE (name, version, tenant_type)
);

-- Enable RLS on rule_templates
ALTER TABLE rule_templates ENABLE ROW LEVEL SECURITY;

-- RLS policy for rule_templates - tenant isolation
CREATE POLICY rule_templates_tenant_isolation ON rule_templates
    FOR ALL
    USING (
        tenant_type = current_setting('app.current_tenant_type')::tenant_type
        OR 
        -- Superadmin can access all tenants
        EXISTS (
            SELECT 1 FROM role_assignments ra 
            WHERE ra.user_id = current_setting('app.current_user_id')::UUID 
            AND ra.role = 'superadmin' 
            AND ra.revoked_at IS NULL
        )
    );

-- Rule template changes history
CREATE TABLE rule_template_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES rule_templates(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted'
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    old_data JSONB,
    new_data JSONB,
    diff_summary TEXT,
    tenant_type tenant_type NOT NULL
);

-- Enable RLS on rule_template_changes
ALTER TABLE rule_template_changes ENABLE ROW LEVEL SECURITY;

-- RLS policy for rule_template_changes - same as rule_templates
CREATE POLICY rule_template_changes_tenant_isolation ON rule_template_changes
    FOR ALL
    USING (
        tenant_type = current_setting('app.current_tenant_type')::tenant_type
        OR 
        EXISTS (
            SELECT 1 FROM role_assignments ra 
            WHERE ra.user_id = current_setting('app.current_user_id')::UUID 
            AND ra.role = 'superadmin' 
            AND ra.revoked_at IS NULL
        )
    );

-- Audit logs table for tracking admin actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    tenant_type tenant_type,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for efficient querying
    CONSTRAINT audit_logs_action_check 
        CHECK (action IN ('create', 'read', 'update', 'delete', 'login', 'logout', 'permission_denied'))
);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for audit_logs - superadmin sees all, tenant_admin sees their tenant
CREATE POLICY audit_logs_access ON audit_logs
    FOR ALL
    USING (
        -- Superadmin can see all logs
        EXISTS (
            SELECT 1 FROM role_assignments ra 
            WHERE ra.user_id = current_setting('app.current_user_id')::UUID 
            AND ra.role = 'superadmin' 
            AND ra.revoked_at IS NULL
        )
        OR
        -- Tenant admin can see logs for their tenant
        (
            EXISTS (
                SELECT 1 FROM role_assignments ra 
                WHERE ra.user_id = current_setting('app.current_user_id')::UUID 
                AND ra.role = 'tenant_admin' 
                AND ra.tenant_type = current_setting('app.current_tenant_type')::tenant_type
                AND ra.revoked_at IS NULL
            )
            AND tenant_type = current_setting('app.current_tenant_type')::tenant_type
        )
        OR
        -- Auditor can see all logs (read-only role)
        EXISTS (
            SELECT 1 FROM role_assignments ra 
            WHERE ra.user_id = current_setting('app.current_user_id')::UUID 
            AND ra.role = 'auditor' 
            AND ra.revoked_at IS NULL
        )
    );

-- Create indexes for performance
CREATE INDEX idx_role_assignments_user_id ON role_assignments(user_id);
CREATE INDEX idx_role_assignments_role_tenant ON role_assignments(role, tenant_type) WHERE revoked_at IS NULL;
CREATE INDEX idx_rule_templates_tenant_type ON rule_templates(tenant_type);
CREATE INDEX idx_rule_templates_name_version ON rule_templates(name, version);
CREATE INDEX idx_rule_template_changes_template_id ON rule_template_changes(template_id);
CREATE INDEX idx_rule_template_changes_changed_at ON rule_template_changes(changed_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_tenant_type ON audit_logs(tenant_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Insert default superadmin role for demo user
INSERT INTO role_assignments (user_id, role, assigned_by) 
SELECT u.id, 'superadmin', u.id
FROM users u 
WHERE u.email = 'demo@example.com' 
AND u.tenant_type = 'COMMERCIAL'
ON CONFLICT (user_id, role, tenant_type) DO NOTHING;

-- Function to get effective role for a user
CREATE OR REPLACE FUNCTION get_user_effective_role(p_user_id UUID, p_tenant_type tenant_type DEFAULT NULL)
RETURNS admin_role AS $$
DECLARE
    user_role admin_role;
BEGIN
    SELECT ra.role INTO user_role
    FROM role_assignments ra
    WHERE ra.user_id = p_user_id 
    AND ra.revoked_at IS NULL
    AND (ra.tenant_type = p_tenant_type OR ra.tenant_type IS NULL OR ra.role = 'superadmin')
    ORDER BY 
        CASE ra.role 
            WHEN 'superadmin' THEN 1
            WHEN 'tenant_admin' THEN 2  
            WHEN 'auditor' THEN 3
        END
    LIMIT 1;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has admin permission
CREATE OR REPLACE FUNCTION user_has_admin_permission(
    p_user_id UUID, 
    p_permission TEXT,
    p_tenant_type tenant_type DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    user_role admin_role;
    has_perm BOOLEAN := FALSE;
BEGIN
    user_role := get_user_effective_role(p_user_id, p_tenant_type);
    
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Superadmin has all permissions
    IF user_role = 'superadmin' THEN
        RETURN TRUE;
    END IF;
    
    -- Check specific permissions by role
    CASE user_role
        WHEN 'tenant_admin' THEN
            has_perm := p_permission IN (
                'admin:users:read', 'admin:users:write',
                'admin:templates:read', 'admin:templates:write',
                'admin:integrations:read', 'admin:integrations:write',
                'admin:audit:read'
            );
        WHEN 'auditor' THEN
            has_perm := p_permission IN (
                'admin:tenants:read', 'admin:users:read',
                'admin:templates:read', 'admin:integrations:read',
                'admin:audit:read', 'admin:system:read'
            );
        ELSE
            has_perm := FALSE;
    END CASE;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;