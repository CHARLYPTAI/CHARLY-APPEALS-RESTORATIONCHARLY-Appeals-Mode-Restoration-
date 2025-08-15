# Admin Audit Log Explorer

The Audit Log Explorer provides comprehensive visibility into system activity, compliance events, and security incidents across all tenants. This tool is essential for monitoring, compliance, and incident investigation.

## Overview

The audit log system captures all significant user actions and system events, providing:

- **Complete Activity Tracking**: Every user action, API call, and system event
- **RBAC-Aware Access**: Role-based filtering and tenant isolation
- **Advanced Filtering**: Multi-dimensional search with correlation tracking
- **Compliance Features**: PII redaction, retention policies, and audit trails
- **Export Capabilities**: CSV export for compliance reporting and analysis

## Access Requirements

Access to audit logs is controlled through the RBAC system:

### Permissions Required
- `admin:audit:read` - Required for viewing audit logs

### Role-Based Access

| Role | Access Level | Restrictions |
|------|-------------|-------------|
| **superadmin** | Full access | Can view all tenants and export data |
| **tenant_admin** | Tenant-scoped | Limited to their own tenant only |
| **auditor** | Read-only | Can view logs but with read-only access |

## Features

### 1. Advanced Filtering

#### Primary Filters
- **Tenant**: Filter by RESIDENTIAL or COMMERCIAL (superadmin only)
- **Action**: Filter by action type (CREATE, UPDATE, DELETE, LOGIN, etc.)
- **Status**: Filter by event status (SUCCESS, DENIED, ERROR)
- **Quick Date Range**: 24-hour or 7-day presets

#### Advanced Filters
- **Actor**: Search by user email or ID
- **Route/Path**: Filter by API endpoint prefix
- **Correlation ID**: Track related events in a session
- **Custom Date Range**: Precise UTC datetime filtering

### 2. Correlation ID Tracking

The system supports advanced event correlation for tracking user sessions and investigating incidents:

#### Deep-linking
- **URL Hash Support**: Share specific correlation traces via `#cid=correlation-id`
- **Automatic Time Windows**: ±5 minutes around correlation events
- **Session Reconstruction**: View complete user journeys

#### Correlation Banner
When filtering by correlation ID, a banner displays:
- Number of related events
- Time window context
- Copy and share controls
- Clear filter option

### 3. Data Table Features

#### Sortable Columns
- **Timestamp**: Default descending sort
- **Actor**: Sort by user email
- **Action**: Sort by action type
- **Resource**: Sort by resource type

#### Pagination
- **Page Sizes**: 25, 50, or 100 records per page
- **Server-side Pagination**: Efficient handling of large datasets
- **Total Count**: Clear indication of total matching records

#### Row Actions
- **Details Expansion**: View full event context
- **Correlation Trace**: Filter by correlation ID
- **Copy Controls**: Copy IDs and correlation values

### 4. Event Detail Panel

Each audit event can be expanded to show:

#### Metadata
- **Correlation ID**: With deep-link and filter controls
- **Request Information**: HTTP method, route, IP address
- **User Agent**: Browser/client information

#### Resource Information
- **Resource Type**: Category of affected resource
- **Resource ID**: Specific resource identifier

#### Event Details
- **PII-Safe JSON**: Automatically redacted sensitive data
- **Copy Controls**: Easy copying of correlation IDs and details

#### Privacy & Security
- **PII Redaction**: Emails, tokens, passwords automatically masked
- **IP Anonymization**: IP addresses partially hidden for privacy
- **Retention Notice**: Clear data retention policy display

### 5. CSV Export

#### Export Features
- **Filtered Results**: Exports respect current filter settings
- **10,000 Record Limit**: Prevents overwhelming exports
- **Streaming Generation**: Efficient handling of large datasets
- **Anonymized Data**: IP addresses and PII properly anonymized

#### Export Format
CSV includes columns:
- Timestamp (ISO 8601 UTC)
- User Email
- Action
- Resource Type
- Resource ID
- Tenant Type
- Status
- Route
- HTTP Method
- Correlation ID
- IP Address (Anonymized)

## Usage Guide

### Basic Usage

1. **Navigate** to Admin → Audit Logs
2. **Set Filters** using the filter panel
3. **Apply Filters** to load matching events
4. **Expand Rows** to view detailed event information
5. **Export Data** if needed for reporting

### Correlation Investigation

To investigate a user session or incident:

1. **Find Initial Event** using basic filters
2. **Copy Correlation ID** from event details
3. **Click "Filter Events"** or manually enter correlation ID
4. **Review Timeline** of related events
5. **Share Deep-link** for collaboration

### Date Range Filtering

For compliance reporting:

1. **Use Advanced Filters** section
2. **Set Precise Date Range** in UTC
3. **Combine with Other Filters** (tenant, action, etc.)
4. **Export Results** for analysis

### Troubleshooting Access Issues

1. **Filter by Actor** using user email or ID
2. **Set Status Filter** to "DENIED" for failed attempts
3. **Check Route Patterns** for specific endpoints
4. **Use Correlation Tracking** to see full context

## Data Retention & Privacy

### Retention Policy
- **180 Days**: All audit logs are retained for 180 days
- **Automatic Purging**: Older logs are automatically removed
- **Compliance**: Meets regulatory requirements for audit trails

### Privacy Protection
- **PII Redaction**: Sensitive data automatically masked
- **IP Anonymization**: IP addresses partially hidden
- **Secure Export**: Exported data maintains privacy protections

### Data Redaction Rules

| Data Type | Redaction Method | Example |
|-----------|-----------------|---------|
| Email Addresses | First/last 2 chars shown | `us***er@domain.com` |
| Passwords | Complete redaction | `[REDACTED]` |
| Tokens | First 8/last 4 chars | `abc12345...xyz9` |
| IP Addresses | Last octet/segment masked | `192.168.1.xxx` |

## API Reference

### GET /api/admin/audit/logs

Retrieve audit logs with filtering and pagination.

#### Query Parameters
- `tenant` (string): RESIDENTIAL or COMMERCIAL
- `actor` (string): User email or ID search
- `action` (string): Specific action type
- `resourceType` (string): Resource category
- `route` (string): API route prefix
- `status` (string): SUCCESS, DENIED, or ERROR
- `correlationId` (string): Exact correlation ID
- `from` (datetime): Start of date range (ISO 8601 UTC)
- `to` (datetime): End of date range (ISO 8601 UTC)
- `sort` (string): Sort field and direction (e.g., "createdAt:desc")
- `limit` (number): Records per page (1-100, default 50)
- `offset` (number): Pagination offset (default 0)

#### Response Format
```json
{
  "logs": [
    {
      "id": "string",
      "userId": "string",
      "userEmail": "string",
      "action": "string",
      "resourceType": "string",
      "resourceId": "string",
      "tenantType": "string",
      "status": "string",
      "route": "string",
      "method": "string",
      "details": {},
      "ipAddress": "string",
      "userAgent": "string",
      "correlationId": "string",
      "createdAt": "string"
    }
  ],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

### GET /api/admin/audit/logs/export

Export audit logs as CSV with same filtering options as the main endpoint.

#### Response
- **Content-Type**: `text/csv; charset=utf-8`
- **Content-Disposition**: `attachment; filename="audit-logs-YYYY-MM-DD.csv"`
- **Limit**: Maximum 10,000 records per export

## Security Considerations

### Access Control
- **RBAC Enforcement**: All access controlled through role-based permissions
- **Tenant Isolation**: tenant_admin users cannot access other tenants
- **Audit Trail**: All audit log access is itself audited

### Data Protection
- **In-Transit**: All API calls use HTTPS with proper headers
- **At-Rest**: Database-level encryption for audit log storage
- **Export Security**: CSV exports maintain anonymization

### Compliance Features
- **Correlation Tracking**: Complete session reconstruction for investigations
- **Retention Policies**: Automatic data lifecycle management
- **Privacy Protection**: Built-in PII redaction and anonymization

## Troubleshooting

### Common Issues

#### No Events Showing
1. Check date range - ensure it covers the expected time period
2. Verify tenant filter matches expected data
3. Clear all filters and try basic search
4. Check user permissions for audit:read

#### Slow Performance
1. Use more specific filters to reduce dataset size
2. Limit date ranges to smaller windows
3. Use pagination rather than large page sizes
4. Consider using correlation ID for targeted searches

#### Export Not Working
1. Verify admin:audit:read permission
2. Check if dataset exceeds 10,000 record limit
3. Try exporting with more restrictive filters
4. Ensure browser allows file downloads

#### Correlation Tracking Issues
1. Verify correlation ID exists in the timeframe
2. Check ±5 minute window may need adjustment
3. Ensure correlation ID is exact match
4. Try manual correlation ID filter

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Access Denied" | Missing admin:audit:read permission | Contact administrator for permission |
| "No events found" | Filters too restrictive or no data | Adjust filters or check date range |
| "Export failed" | Server error or oversized request | Reduce filter scope and retry |
| "Invalid correlation ID" | Malformed or non-existent ID | Verify ID format and existence |

## Best Practices

### Performance
- Use specific date ranges rather than open-ended queries
- Combine multiple filters to reduce result sets
- Use correlation ID filtering for incident investigation
- Export in chunks for large datasets

### Security
- Always use HTTPS for accessing audit logs
- Don't share correlation deep-links containing sensitive IDs
- Use tenant-scoped accounts where possible
- Regularly review audit log access patterns

### Compliance
- Export regular compliance reports with date ranges
- Document investigation procedures using correlation tracking
- Maintain exported audit logs according to regulatory requirements
- Use retention policies to manage data lifecycle

## Integration

### With Other Admin Tools
- **User Management**: Cross-reference user actions with user records
- **Role Management**: Verify permission changes and role assignments
- **System Monitoring**: Correlate audit events with system performance

### External Tools
- **SIEM Integration**: Export CSV for security information and event management
- **Compliance Platforms**: Regular exports for regulatory reporting
- **Incident Response**: Correlation tracking for security investigations