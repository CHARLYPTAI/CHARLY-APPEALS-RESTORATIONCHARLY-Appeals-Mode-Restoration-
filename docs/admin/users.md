# Admin Users Console

## Overview

The Admin Users Console provides comprehensive user management functionality for the CHARLY platform, enabling administrators to manage user accounts, roles, and permissions across tenants. This feature implements full RBAC (Role-Based Access Control) with tenant isolation and comprehensive audit logging.

## Features

### User Management Table
- **Server-side pagination**: Efficiently handle large user datasets with configurable page sizes (10, 20, 50, 100)
- **Advanced search**: Search users by email or user ID with real-time filtering
- **Multi-dimensional filtering**: Filter by tenant, role, and status (active/inactive)
- **Sortable columns**: Sort by email, tenant, role, status, and last login with remembered state
- **Responsive design**: Mobile-friendly layout with horizontal scrolling for table content

### User Creation
- **Role-based user creation**: Create users with appropriate role assignments
- **Tenant-scoped permissions**: Tenant admins can only create users within their tenant
- **Form validation**: Client-side validation with backend schema enforcement
- **Duplicate detection**: Prevents creation of users with existing email addresses
- **Email invitation system**: Optional email invitations with setup instructions

### User Management
- **Role assignment**: Assign and modify user roles (superadmin, tenant_admin, auditor)
- **Status management**: Activate/deactivate user accounts
- **Permission validation**: Role assignments enforce RBAC rules
- **Cross-tenant restrictions**: Prevent unauthorized cross-tenant operations

### User Detail View
- **Comprehensive profile**: View full user details including creation date, last login, status
- **Role history**: Complete audit trail of role assignments and changes
- **Edit capabilities**: Modify user roles and status with appropriate permissions
- **Tenant context**: Clear display of tenant affiliation and restrictions

## Role-Based Access Control (RBAC)

### Permission Matrix

| Role | Users Read | Users Write | Cross-Tenant | Role Assignment |
|------|------------|-------------|--------------|-----------------|
| **Superadmin** | ✅ All tenants | ✅ All tenants | ✅ | ✅ All roles |
| **Tenant Admin** | ✅ Own tenant | ✅ Own tenant | ❌ | ✅ tenant_admin, auditor |
| **Auditor** | ✅ Own tenant | ❌ | ❌ | ❌ |

### Role Restrictions
- **Superadmin**: Full access across all tenants and users
- **Tenant Admin**: Limited to users within their assigned tenant
- **Auditor**: Read-only access to users within their assigned tenant

## Technical Implementation

### Frontend Components

#### Users.tsx
Main users management page with:
- Advanced filtering and search
- Server-side pagination
- Sortable table headers
- Role-based UI rendering
- Real-time status updates

#### UserDetailDrawer.tsx
Sliding drawer for user details:
- User profile information
- Role assignment history
- Edit capabilities with validation
- WCAG AA compliant modal interface

#### CreateUserModal.tsx
Modal form for creating new users:
- Multi-step validation
- Tenant scope enforcement
- Role assignment dropdown
- Email invitation option

#### Toast.tsx
Notification system:
- Success/error/warning messages
- Auto-dismiss functionality
- Screen reader compatibility

### Backend API Endpoints

#### GET /api/admin/users
List users with filtering and pagination:
```typescript
Query Parameters:
- tenant?: 'RESIDENTIAL' | 'COMMERCIAL'
- search?: string
- role?: string  
- status?: 'active' | 'inactive'
- sort?: string (field:direction)
- limit?: number (1-100)
- offset?: number
```

#### POST /api/admin/users
Create new user:
```typescript
Body:
- email: string (required)
- password: string (required, min 8 chars)
- tenantType: 'RESIDENTIAL' | 'COMMERCIAL' (required)
- role?: 'superadmin' | 'tenant_admin' | 'auditor'
- sendInvite?: boolean
```

#### PATCH /api/admin/users/:id
Update user role and status:
```typescript
Body:
- role?: 'superadmin' | 'tenant_admin' | 'auditor' | null
- isActive?: boolean
```

#### GET /api/admin/users/:id/roles
Get user role assignment history:
```typescript
Response:
- roleAssignments: Array of role assignment records
```

### Database Schema

#### role_assignments Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to users)
- role: admin_role ENUM
- tenant_type: tenant_type (nullable for superadmin)
- assigned_by: UUID (Foreign Key to users)
- assigned_at: TIMESTAMP
- revoked_at: TIMESTAMP (nullable)
```

#### audit_logs Table
All user management actions are logged:
```sql
- user_id: UUID (Actor)
- action: VARCHAR ('create', 'update', 'delete')
- resource_type: VARCHAR ('user')
- resource_id: UUID (Target user)
- tenant_type: tenant_type
- details: JSONB (Change details)
- correlation_id: VARCHAR (Request tracking)
```

### Row Level Security (RLS)

#### Tenant Isolation
- Superadmin: Access to all users across tenants
- Tenant Admin: Access only to users in their tenant
- Auditor: Read-only access to users in their tenant

#### RLS Policies
```sql
-- role_assignments table
CREATE POLICY role_assignments_access ON role_assignments
FOR ALL USING (
  -- Superadmin sees all
  EXISTS (SELECT 1 FROM role_assignments ra WHERE ra.user_id = current_setting('app.current_user_id')::UUID AND ra.role = 'superadmin' AND ra.revoked_at IS NULL)
  OR
  -- Tenant admin sees own tenant
  (EXISTS (SELECT 1 FROM role_assignments ra WHERE ra.user_id = current_setting('app.current_user_id')::UUID AND ra.role = 'tenant_admin' AND ra.tenant_type = current_setting('app.current_tenant_type')::tenant_type AND ra.revoked_at IS NULL)
   AND (tenant_type = current_setting('app.current_tenant_type')::tenant_type OR tenant_type IS NULL))
);
```

## Security Features

### Authentication & Authorization
- JWT-based authentication with refresh token support
- Role-based permission checking on all operations
- Tenant scope validation for cross-tenant access prevention

### Input Validation
- Email format validation (RFC 5322 compliant)
- Password strength requirements (minimum 8 characters)
- Role assignment validation against permission matrix
- SQL injection prevention through parameterized queries

### Audit Logging
- Complete audit trail of all user management actions
- Correlation ID tracking for request tracing
- IP address and user agent logging
- RFC 7807 error response format

### Data Protection
- Tenant data isolation through RLS
- Encrypted password storage (bcrypt)
- No sensitive data in client-side logs
- CORS protection on API endpoints

## Accessibility (WCAG AA)

### Keyboard Navigation
- Full keyboard accessibility for all interactive elements
- Tab order follows logical reading flow
- Arrow key navigation for table sorting
- Enter/Space activation for buttons

### Screen Reader Support
- Semantic HTML structure with proper headings
- ARIA labels on all interactive elements
- Live regions for dynamic content updates
- Role attributes for complex widgets

### Visual Design
- High contrast color scheme (4.5:1 minimum ratio)
- Scalable text up to 200% without horizontal scrolling
- Focus indicators visible on all interactive elements
- Status indicators use both color and text/icons

### Mobile Responsiveness
- Responsive breakpoints: 640px, 768px, 1024px, 1280px
- Touch-friendly button sizes (minimum 44px)
- Horizontal scroll for table on mobile devices
- Collapsible filter controls for small screens

## Error Handling

### Client-Side
- Form validation with real-time feedback
- Network error retry with exponential backoff
- Toast notifications for user feedback
- Graceful degradation for API failures

### Server-Side
- RFC 7807 compliant error responses
- Detailed error codes for client handling
- Validation error aggregation
- Correlation ID tracking for debugging

### Example Error Response
```json
{
  "type": "about:blank",
  "title": "Validation Error",
  "status": 400,
  "detail": "Email address already exists",
  "instance": "/api/admin/users",
  "correlationId": "admin-users-1692123456789-abc123",
  "code": "USER_EMAIL_EXISTS"
}
```

## Performance Considerations

### Frontend Optimization
- React.memo for component memoization
- useCallback/useMemo for expensive computations
- Debounced search input (300ms delay)
- Lazy loading for large datasets
- Code splitting for admin routes

### Backend Optimization
- Database indexes on frequently queried columns
- Query optimization with EXPLAIN ANALYZE
- Connection pooling for database access
- Caching headers for static responses

### Monitoring
- Performance metrics collection
- Error rate monitoring
- API response time tracking
- Database query performance

## Usage Examples

### Creating a New User
1. Click "Create User" button (requires admin:users:write permission)
2. Fill in required fields: email, password, tenant type
3. Optionally assign role and enable email invitation
4. Submit form - user created with audit log entry

### Managing User Roles
1. Click on user row to open detail drawer
2. Select new role from dropdown (filtered by permissions)
3. Save changes - role assignment logged with timestamp
4. Previous role automatically revoked

### Filtering and Search
1. Use search box for email/ID lookup
2. Apply filters for tenant, role, status
3. Click column headers to sort data
4. Navigate pages with pagination controls

## Testing

### Unit Tests
- Component rendering tests
- Permission matrix validation
- Form validation logic
- API integration tests

### Integration Tests
- End-to-end user workflows
- Cross-tenant access prevention
- Role assignment scenarios
- Error handling paths

### Accessibility Tests
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation
- Mobile responsiveness testing

## Future Enhancements

### Planned Features
- Bulk user operations (import/export)
- Advanced role templates
- User activity dashboard
- Email template customization
- Single Sign-On (SSO) integration

### Performance Improvements
- Virtual scrolling for large datasets
- Real-time updates with WebSocket
- Advanced caching strategies
- Database query optimization

### Security Enhancements
- Multi-factor authentication
- Session management improvements
- Enhanced audit logging
- Rate limiting per user/IP