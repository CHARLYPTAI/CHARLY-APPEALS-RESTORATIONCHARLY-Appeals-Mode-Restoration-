# Roles & Permissions Management

The Roles & Permissions system provides granular access control for the CHARLY platform, allowing administrators to define custom roles with specific permission sets and assign them to users based on their responsibilities and scope of access.

## Overview

The system is built around the principle of least privilege, where users are granted only the minimum permissions necessary to perform their job functions. Roles can be scoped either globally (across all tenants) or to specific tenant types (RESIDENTIAL or COMMERCIAL).

## Key Concepts

### Roles

A **role** is a named collection of permissions that defines what actions a user can perform within the system. Each role has:

- **Name**: A unique identifier for the role
- **Description**: Human-readable explanation of the role's purpose
- **Scope**: Either `global` (system-wide) or `tenant` (tenant-specific)
- **Permissions**: A list of permission identifiers granted to the role
- **Version**: Auto-incremented version number for audit tracking
- **Tenant Type**: For tenant-scoped roles, specifies RESIDENTIAL or COMMERCIAL

### Permissions

A **permission** represents a specific action or resource access right. Permissions are organized into categories and follow a hierarchical naming convention:

```
<category>:<resource>:<action>
```

Examples:
- `admin:users:read` - View user accounts
- `admin:users:write` - Create/modify user accounts
- `property:data:read` - View property information
- `appeals:cases:write` - Create/modify appeal cases

### Permission Categories

The system organizes permissions into logical categories:

1. **Admin System** (`admin_system`) - System-wide administration and configuration
2. **Admin Users** (`admin_users`) - User management and role assignments
3. **Admin Tenants** (`admin_tenants`) - Tenant management and configuration
4. **Admin Templates** (`admin_templates`) - Rule template management
5. **Admin Audit** (`admin_audit`) - Audit log access and monitoring
6. **Property Read** (`property_read`) - Property data viewing and searching
7. **Property Write** (`property_write`) - Property data creation and modification
8. **Appeals Read** (`appeals_read`) - Appeal case viewing and tracking
9. **Appeals Write** (`appeals_write`) - Appeal case creation and management
10. **Reports Read** (`reports_read`) - Report viewing and export
11. **Reports Write** (`reports_write`) - Report creation and configuration
12. **Integration** (`integration`) - External system integrations

### System vs. Regular Permissions

- **System Permissions**: Marked with `isSystem: true`, these are powerful permissions that affect system-wide configuration and are only available to global roles
- **Regular Permissions**: Standard permissions that can be assigned to both global and tenant-scoped roles

## Role Scoping Rules

### Global Roles
- Can access all tenant types (RESIDENTIAL and COMMERCIAL)
- Can be assigned system permissions
- Typically used for platform administrators and support staff
- Created and managed by superadmin users

### Tenant-Scoped Roles
- Limited to operations within a specific tenant type
- Cannot be assigned system permissions
- More appropriate for business users and tenant administrators
- Can be created by superadmin or tenant_admin users (for their own tenant)

## Role Management Interface

### Roles List View

The main roles interface provides:

- **Server-side pagination** with configurable page sizes
- **Search functionality** by role name and description
- **Filtering options**:
  - Scope (global/tenant/all)
  - Tenant type (RESIDENTIAL/COMMERCIAL) when filtering by tenant scope
- **Sorting** by name, scope, or last modified date
- **Bulk operations** for import/export

### Role Editor

The role editor provides a comprehensive interface for creating and modifying roles:

#### Basic Information Section
- Role name (required, minimum 3 characters)
- Description (required)
- Scope selection (global or tenant)
- Tenant type selection (for tenant-scoped roles)
- Change notes (required for audit trail)

#### Permission Matrix
Interactive permission selection with:
- **Category grouping** for organized permission management
- **Group selection** to quickly assign all permissions in a category
- **Individual permission toggles** with descriptions
- **Live preview** showing what the role can access
- **Scope-aware filtering** (system permissions hidden for tenant roles)

#### Validation Rules
- Role name must be unique within the scope/tenant combination
- At least one permission must be selected
- Change notes required for audit tracking
- Scope cannot be changed after creation (security constraint)

### Permission Preview

The editor includes a real-time preview showing:
- Summary of selected permissions by category
- Human-readable description of access capabilities
- Scope and tenant limitations
- Permission count and validation status

## Import/Export Functionality

### Export Features
- **Selective export**: Choose specific roles to include
- **JSON format**: Standard format for role definitions
- **Complete role data**: Includes all metadata and permissions
- **Audit information**: Preserves version and modification history

### Import Features
- **JSON validation**: Ensures file format correctness
- **Role validation**: Verifies required fields and permission references
- **Conflict resolution**:
  - **Rename**: Automatically rename conflicting roles (e.g., "Role Name (1)")
  - **Overwrite**: Replace existing roles with imported data
  - **Skip**: Ignore roles that already exist
- **Import summary**: Detailed report of imported, skipped, and modified roles

### Import File Format

```json
{
  "roles": [
    {
      "name": "Property Manager",
      "description": "Manages property data and appeals for commercial properties",
      "scope": "tenant",
      "tenantType": "COMMERCIAL",
      "permissions": [
        "property:data:read",
        "property:data:write",
        "appeals:cases:read",
        "appeals:cases:write"
      ]
    }
  ]
}
```

## RBAC (Role-Based Access Control) Enforcement

### Database Level
- **Row Level Security (RLS)**: Ensures tenant isolation at the database level
- **Audit logging**: All role operations logged with correlation IDs
- **Versioning**: Role changes create new versions with change tracking

### API Level
- **Permission middleware**: Validates user permissions before API access
- **Scope validation**: Ensures users can only access permitted tenant data
- **Audit trail**: All role assignments and modifications logged

### UI Level
- **Route guards**: Prevent access to unauthorized admin sections
- **Component-level checks**: Hide/disable features based on permissions
- **Context-aware rendering**: Show relevant options based on user scope

## Versioning and Audit Trail

### Version Management
- Each role modification creates a new version
- Version history preserved for audit and rollback purposes
- Change notes required for all modifications
- Editor and timestamp recorded for each version

### Audit Logging
All role operations generate audit entries with:
- **User ID**: Who performed the action
- **Action type**: create, read, update, delete
- **Resource details**: Role ID and affected data
- **Change summary**: What was modified
- **Correlation ID**: For tracking related operations
- **IP address and user agent**: For security monitoring

## Security Considerations

### Access Control
- Only users with `admin:roles:read` can view roles
- Only users with `admin:roles:write` can create/modify roles
- Tenant administrators can only manage tenant-scoped roles for their tenant
- System permissions restricted to global roles only

### Validation and Constraints
- Role names must be unique within scope/tenant combination
- Permissions must exist and be valid for the role scope
- Users cannot escalate their own privileges
- Scope changes prevented after role creation

### Audit and Monitoring
- All role operations logged with detailed context
- Permission changes trigger security audit events
- Failed access attempts logged for security monitoring
- Regular permission review workflows recommended

## Best Practices

### Role Design
- **Principle of least privilege**: Grant minimum necessary permissions
- **Business function alignment**: Create roles that match job responsibilities
- **Regular review**: Periodically audit roles and remove unused permissions
- **Clear naming**: Use descriptive names that indicate role purpose

### Permission Management
- **Category organization**: Group related permissions logically
- **Granular control**: Prefer specific permissions over broad access
- **Read/write separation**: Separate viewing and modification permissions
- **System permission caution**: Carefully control system-level access

### Operational Procedures
- **Change documentation**: Always provide meaningful change notes
- **Testing**: Verify role permissions in non-production environments
- **Backup**: Regular export of role configurations
- **Monitoring**: Watch audit logs for unusual permission activity

## API Endpoints

### Role Management
- `GET /api/admin/roles` - List roles with filtering and pagination
- `POST /api/admin/roles` - Create new role
- `GET /api/admin/roles/:id` - Get specific role details
- `PATCH /api/admin/roles/:id` - Update existing role
- `DELETE /api/admin/roles/:id` - Delete role (if not assigned to users)

### Permission Discovery
- `GET /api/admin/permissions` - List all available permissions
- `GET /api/admin/permissions/categories` - Get permission categories

### Import/Export
- `POST /api/admin/roles/import` - Import roles from JSON
- `GET /api/admin/roles/export` - Export selected roles to JSON

### Audit
- `GET /api/admin/audit/roles` - Get role-related audit entries
- `GET /api/admin/roles/:id/history` - Get role version history

## Error Handling

The system provides comprehensive error handling with RFC7807-compliant error responses:

### Common Error Scenarios
- **Permission denied**: User lacks required permissions
- **Validation errors**: Invalid input data or constraints
- **Conflict errors**: Role name conflicts or permission conflicts
- **Not found**: Role or permission does not exist
- **Constraint violations**: Business rules or database constraints

### Error Response Format
```json
{
  "type": "about:blank",
  "title": "Validation Error",
  "status": 400,
  "detail": "Role name must be unique within the tenant scope",
  "instance": "/api/admin/roles",
  "correlationId": "req-12345",
  "code": "ROLE_NAME_CONFLICT",
  "errors": [
    {
      "field": "name",
      "message": "A role with this name already exists"
    }
  ]
}
```

## Integration with User Management

The roles system integrates tightly with user management:

### User-Role Assignment
- Users can have multiple roles across different scopes
- Role assignments include tenant context for tenant-scoped roles
- Effective permissions calculated from all assigned roles
- Assignment changes logged in audit trail

### Permission Aggregation
- User permissions aggregated from all assigned roles
- No permission conflicts (all permissions are additive)
- Scope-based filtering applied during permission checks
- Real-time permission evaluation for API requests

### Session Management
- User permissions cached in JWT tokens
- Token refresh required after role assignments change
- Permission changes reflected in new sessions
- Existing sessions may require re-authentication for sensitive operations