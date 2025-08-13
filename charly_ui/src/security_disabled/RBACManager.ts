/**
 * CHARLY 2.0 - Role-Based Access Control (RBAC) Manager
 * Enterprise-grade permission and role management system
 */

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresMFA?: boolean;
  conditions?: AccessCondition[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  inheritsFrom?: string[]; // Parent role IDs
  isSystem: boolean;
  isActive: boolean;
  maxUsers?: number;
  expiresAt?: Date;
  metadata: Record<string, unknown>;
}

interface UserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  conditions?: AccessCondition[];
  isActive: boolean;
}

interface AccessCondition {
  type: 'time_based' | 'ip_based' | 'location_based' | 'device_based' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'matches';
  field: string;
  value: unknown;
  description: string;
}

interface AccessRequest {
  userId: string;
  resource: string;
  action: string;
  context: AccessContext;
  requestId: string;
  timestamp: Date;
}

interface AccessContext {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  sessionId: string;
  mfaVerified: boolean;
  riskScore: number;
  additionalData?: Record<string, unknown>;
}

interface AccessResult {
  granted: boolean;
  reason: string;
  requiredPermissions: string[];
  missingPermissions: string[];
  conditionalAccess?: {
    requiresMFA: boolean;
    requiresApproval: boolean;
    expiresAt?: Date;
  };
  auditData: {
    requestId: string;
    userId: string;
    resource: string;
    action: string;
    decision: 'granted' | 'denied' | 'conditional';
    evaluationTime: number;
    appliedRoles: string[];
    appliedPermissions: string[];
  };
}

interface ResourceHierarchy {
  [resource: string]: {
    parent?: string;
    children?: string[];
    actions: string[];
  };
}

class RBACManager {
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();
  private resourceHierarchy: ResourceHierarchy = {};
  private accessLog: AccessResult[] = [];
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.initializeSystemPermissions();
    this.initializeSystemRoles();
    this.loadResourceHierarchy();
    this.setupPeriodicCleanup();
  }

  // Permission Management
  private initializeSystemPermissions(): void {
    const systemPermissions: Permission[] = [
      // User Management
      {
        id: 'users.read',
        name: 'Read Users',
        resource: 'users',
        action: 'read',
        description: 'View user information',
        category: 'user_management',
        riskLevel: 'low'
      },
      {
        id: 'users.create',
        name: 'Create Users',
        resource: 'users',
        action: 'create',
        description: 'Create new users',
        category: 'user_management',
        riskLevel: 'medium',
        requiresMFA: true
      },
      {
        id: 'users.update',
        name: 'Update Users',
        resource: 'users',
        action: 'update',
        description: 'Modify user information',
        category: 'user_management',
        riskLevel: 'medium'
      },
      {
        id: 'users.delete',
        name: 'Delete Users',
        resource: 'users',
        action: 'delete',
        description: 'Delete user accounts',
        category: 'user_management',
        riskLevel: 'critical',
        requiresMFA: true
      },

      // Property Management
      {
        id: 'properties.read',
        name: 'Read Properties',
        resource: 'properties',
        action: 'read',
        description: 'View property information',
        category: 'property_management',
        riskLevel: 'low'
      },
      {
        id: 'properties.create',
        name: 'Create Properties',
        resource: 'properties',
        action: 'create',
        description: 'Add new properties',
        category: 'property_management',
        riskLevel: 'medium'
      },
      {
        id: 'properties.update',
        name: 'Update Properties',
        resource: 'properties',
        action: 'update',
        description: 'Modify property information',
        category: 'property_management',
        riskLevel: 'medium'
      },
      {
        id: 'properties.delete',
        name: 'Delete Properties',
        resource: 'properties',
        action: 'delete',
        description: 'Remove properties',
        category: 'property_management',
        riskLevel: 'high',
        requiresMFA: true
      },

      // Appeals Management
      {
        id: 'appeals.read',
        name: 'Read Appeals',
        resource: 'appeals',
        action: 'read',
        description: 'View appeal information',
        category: 'appeals_management',
        riskLevel: 'low'
      },
      {
        id: 'appeals.create',
        name: 'Create Appeals',
        resource: 'appeals',
        action: 'create',
        description: 'Submit new appeals',
        category: 'appeals_management',
        riskLevel: 'medium'
      },
      {
        id: 'appeals.update',
        name: 'Update Appeals',
        resource: 'appeals',
        action: 'update',
        description: 'Modify appeal status',
        category: 'appeals_management',
        riskLevel: 'medium'
      },
      {
        id: 'appeals.submit',
        name: 'Submit Appeals',
        resource: 'appeals',
        action: 'submit',
        description: 'Submit appeals to authorities',
        category: 'appeals_management',
        riskLevel: 'high',
        requiresMFA: true
      },

      // Reports and Analytics
      {
        id: 'reports.read',
        name: 'Read Reports',
        resource: 'reports',
        action: 'read',
        description: 'View generated reports',
        category: 'reporting',
        riskLevel: 'low'
      },
      {
        id: 'reports.create',
        name: 'Create Reports',
        resource: 'reports',
        action: 'create',
        description: 'Generate new reports',
        category: 'reporting',
        riskLevel: 'medium'
      },
      {
        id: 'reports.export',
        name: 'Export Reports',
        resource: 'reports',
        action: 'export',
        description: 'Export reports to external formats',
        category: 'reporting',
        riskLevel: 'medium'
      },
      {
        id: 'analytics.read',
        name: 'Read Analytics',
        resource: 'analytics',
        action: 'read',
        description: 'View analytics data',
        category: 'analytics',
        riskLevel: 'low'
      },

      // System Administration
      {
        id: 'system.configure',
        name: 'Configure System',
        resource: 'system',
        action: 'configure',
        description: 'Modify system configuration',
        category: 'administration',
        riskLevel: 'critical',
        requiresMFA: true
      },
      {
        id: 'system.backup',
        name: 'System Backup',
        resource: 'system',
        action: 'backup',
        description: 'Create system backups',
        category: 'administration',
        riskLevel: 'high',
        requiresMFA: true
      },
      {
        id: 'audit.read',
        name: 'Read Audit Logs',
        resource: 'audit',
        action: 'read',
        description: 'View audit logs',
        category: 'security',
        riskLevel: 'medium'
      },
      {
        id: 'security.manage',
        name: 'Manage Security',
        resource: 'security',
        action: 'manage',
        description: 'Manage security settings',
        category: 'security',
        riskLevel: 'critical',
        requiresMFA: true
      },

      // Role and Permission Management
      {
        id: 'roles.read',
        name: 'Read Roles',
        resource: 'roles',
        action: 'read',
        description: 'View role information',
        category: 'access_control',
        riskLevel: 'low'
      },
      {
        id: 'roles.create',
        name: 'Create Roles',
        resource: 'roles',
        action: 'create',
        description: 'Create new roles',
        category: 'access_control',
        riskLevel: 'high',
        requiresMFA: true
      },
      {
        id: 'roles.update',
        name: 'Update Roles',
        resource: 'roles',
        action: 'update',
        description: 'Modify role permissions',
        category: 'access_control',
        riskLevel: 'high',
        requiresMFA: true
      },
      {
        id: 'roles.assign',
        name: 'Assign Roles',
        resource: 'roles',
        action: 'assign',
        description: 'Assign roles to users',
        category: 'access_control',
        riskLevel: 'high',
        requiresMFA: true
      }
    ];

    systemPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  private initializeSystemRoles(): void {
    const systemRoles: Role[] = [
      {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        permissions: Array.from(this.permissions.keys()),
        isSystem: true,
        isActive: true,
        metadata: { createdAt: new Date() }
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Administrative access with limited system permissions',
        permissions: [
          'users.read', 'users.create', 'users.update',
          'properties.read', 'properties.create', 'properties.update', 'properties.delete',
          'appeals.read', 'appeals.create', 'appeals.update', 'appeals.submit',
          'reports.read', 'reports.create', 'reports.export',
          'analytics.read',
          'audit.read',
          'roles.read', 'roles.assign'
        ],
        isSystem: true,
        isActive: true,
        metadata: { createdAt: new Date() }
      },
      {
        id: 'manager',
        name: 'Manager',
        description: 'Management access with property and appeal oversight',
        permissions: [
          'users.read',
          'properties.read', 'properties.create', 'properties.update',
          'appeals.read', 'appeals.create', 'appeals.update', 'appeals.submit',
          'reports.read', 'reports.create', 'reports.export',
          'analytics.read'
        ],
        isSystem: true,
        isActive: true,
        metadata: { createdAt: new Date() }
      },
      {
        id: 'analyst',
        name: 'Property Analyst',
        description: 'Analysis and reporting access',
        permissions: [
          'properties.read', 'properties.update',
          'appeals.read', 'appeals.create', 'appeals.update',
          'reports.read', 'reports.create',
          'analytics.read'
        ],
        isSystem: true,
        isActive: true,
        metadata: { createdAt: new Date() }
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to properties and reports',
        permissions: [
          'properties.read',
          'appeals.read',
          'reports.read',
          'analytics.read'
        ],
        isSystem: true,
        isActive: true,
        metadata: { createdAt: new Date() }
      },
      {
        id: 'client',
        name: 'Client',
        description: 'Limited access for external clients',
        permissions: [
          'properties.read',
          'appeals.read',
          'reports.read'
        ],
        isSystem: true,
        isActive: true,
        metadata: { createdAt: new Date() }
      }
    ];

    systemRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  private loadResourceHierarchy(): void {
    this.resourceHierarchy = {
      system: {
        actions: ['configure', 'backup', 'monitor'],
        children: ['users', 'security', 'audit']
      },
      users: {
        parent: 'system',
        actions: ['read', 'create', 'update', 'delete', 'activate', 'deactivate']
      },
      security: {
        parent: 'system',
        actions: ['manage', 'configure', 'monitor'],
        children: ['roles', 'permissions']
      },
      roles: {
        parent: 'security',
        actions: ['read', 'create', 'update', 'delete', 'assign', 'revoke']
      },
      permissions: {
        parent: 'security',
        actions: ['read', 'create', 'update', 'delete']
      },
      properties: {
        actions: ['read', 'create', 'update', 'delete', 'import', 'export'],
        children: ['appeals', 'reports']
      },
      appeals: {
        parent: 'properties',
        actions: ['read', 'create', 'update', 'delete', 'submit', 'approve', 'reject']
      },
      reports: {
        actions: ['read', 'create', 'update', 'delete', 'export', 'schedule']
      },
      analytics: {
        actions: ['read', 'create', 'export']
      },
      audit: {
        parent: 'system',
        actions: ['read', 'export']
      }
    };
  }

  // Access Control Methods
  public async checkAccess(request: AccessRequest): Promise<AccessResult> {
    const startTime = performance.now();
    const requestId = request.requestId || this.generateRequestId();

    try {
      // Get user roles
      const userRoles = await this.getUserRoles(request.userId);
      if (userRoles.length === 0) {
        return this.createAccessResult(false, 'No roles assigned', request, [], [], startTime);
      }

      // Get required permissions for the resource and action
      const requiredPermissions = this.getRequiredPermissions(request.resource, request.action);
      
      // Get user permissions from roles
      const userPermissions = await this.getUserPermissions(request.userId);
      
      // Check if user has required permissions
      const missingPermissions = requiredPermissions.filter(
        permission => !userPermissions.includes(permission)
      );

      if (missingPermissions.length > 0) {
        return this.createAccessResult(false, 'Insufficient permissions', request, requiredPermissions, missingPermissions, startTime);
      }

      // Check conditions and context
      const contextCheck = await this.evaluateAccessConditions(request, userRoles);
      if (!contextCheck.allowed) {
        return this.createAccessResult(false, contextCheck.reason, request, requiredPermissions, [], startTime);
      }

      // Check if MFA is required
      const mfaRequired = this.isMFARequired(requiredPermissions, request.context);
      if (mfaRequired && !request.context.mfaVerified) {
        return {
          granted: false,
          reason: 'MFA verification required',
          requiredPermissions,
          missingPermissions: [],
          conditionalAccess: {
            requiresMFA: true,
            requiresApproval: false
          },
          auditData: {
            requestId,
            userId: request.userId,
            resource: request.resource,
            action: request.action,
            decision: 'conditional',
            evaluationTime: performance.now() - startTime,
            appliedRoles: userRoles.map(role => role.roleId),
            appliedPermissions: userPermissions
          }
        };
      }

      // Access granted
      return this.createAccessResult(true, 'Access granted', request, requiredPermissions, [], startTime);

    } catch (error) {
      console.error('[RBAC] Access check failed:', error);
      return this.createAccessResult(false, 'Access check failed', request, [], [], startTime);
    }
  }

  public async hasPermission(userId: string, permission: string, context?: AccessContext): Promise<boolean> {
    const request: AccessRequest = {
      userId,
      resource: this.permissions.get(permission)?.resource || 'unknown',
      action: this.permissions.get(permission)?.action || 'unknown',
      context: context || await this.getDefaultContext(),
      requestId: this.generateRequestId(),
      timestamp: new Date()
    };

    const result = await this.checkAccess(request);
    return result.granted;
  }

  public async hasRole(userId: string, roleId: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.some(role => role.roleId === roleId && role.isActive);
  }

  public async hasAnyRole(userId: string, roleIds: string[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.some(role => roleIds.includes(role.roleId) && role.isActive);
  }

  // Role Management
  public async assignRole(userId: string, roleId: string, assignedBy: string, options?: {
    expiresAt?: Date;
    conditions?: AccessCondition[];
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Validate role exists
      const role = this.roles.get(roleId);
      if (!role) {
        return { success: false, message: 'Role not found' };
      }

      if (!role.isActive) {
        return { success: false, message: 'Role is inactive' };
      }

      // Check if user already has this role
      const existingRoles = await this.getUserRoles(userId);
      if (existingRoles.some(r => r.roleId === roleId && r.isActive)) {
        return { success: false, message: 'User already has this role' };
      }

      // Check role constraints
      if (role.maxUsers) {
        const roleAssignments = await this.getRoleAssignments(roleId);
        if (roleAssignments.length >= role.maxUsers) {
          return { success: false, message: 'Role has reached maximum user limit' };
        }
      }

      // Create role assignment
      const userRole: UserRole = {
        userId,
        roleId,
        assignedBy,
        assignedAt: new Date(),
        expiresAt: options?.expiresAt,
        conditions: options?.conditions,
        isActive: true
      };

      // Store role assignment
      if (!this.userRoles.has(userId)) {
        this.userRoles.set(userId, []);
      }
      this.userRoles.get(userId)!.push(userRole);

      this.emit('roleAssigned', { userId, roleId, assignedBy });
      return { success: true, message: 'Role assigned successfully' };

    } catch (error) {
      console.error('[RBAC] Role assignment failed:', error);
      return { success: false, message: 'Role assignment failed' };
    }
  }

  public async revokeRole(userId: string, roleId: string, revokedBy: string): Promise<{ success: boolean; message: string }> {
    try {
      const userRoles = this.userRoles.get(userId);
      if (!userRoles) {
        return { success: false, message: 'User has no roles' };
      }

      const roleIndex = userRoles.findIndex(role => role.roleId === roleId && role.isActive);
      if (roleIndex === -1) {
        return { success: false, message: 'User does not have this role' };
      }

      // Deactivate role
      userRoles[roleIndex].isActive = false;

      this.emit('roleRevoked', { userId, roleId, revokedBy });
      return { success: true, message: 'Role revoked successfully' };

    } catch (error) {
      console.error('[RBAC] Role revocation failed:', error);
      return { success: false, message: 'Role revocation failed' };
    }
  }

  // Permission and Role Queries
  public async getUserRoles(userId: string): Promise<UserRole[]> {
    const userRoles = this.userRoles.get(userId) || [];
    return userRoles.filter(role => {
      // Check if role is active
      if (!role.isActive) return false;
      
      // Check if role has expired
      if (role.expiresAt && role.expiresAt < new Date()) {
        role.isActive = false;
        return false;
      }
      
      // Check if the role itself is still active
      const roleDefinition = this.roles.get(role.roleId);
      if (!roleDefinition || !roleDefinition.isActive) {
        return false;
      }

      return true;
    });
  }

  public async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.getUserRoles(userId);
    const allPermissions = new Set<string>();

    for (const userRole of userRoles) {
      const role = this.roles.get(userRole.roleId);
      if (role) {
        // Add direct permissions
        role.permissions.forEach(permission => allPermissions.add(permission));
        
        // Add inherited permissions
        if (role.inheritsFrom) {
          for (const parentRoleId of role.inheritsFrom) {
            const parentRole = this.roles.get(parentRoleId);
            if (parentRole && parentRole.isActive) {
              parentRole.permissions.forEach(permission => allPermissions.add(permission));
            }
          }
        }
      }
    }

    return Array.from(allPermissions);
  }

  public async getRoleAssignments(roleId: string): Promise<UserRole[]> {
    const assignments: UserRole[] = [];
    
    for (const [, userRoles] of this.userRoles.entries()) {
      const activeRoles = userRoles.filter(role => 
        role.roleId === roleId && role.isActive
      );
      assignments.push(...activeRoles);
    }
    
    return assignments;
  }

  public getPermission(permissionId: string): Permission | undefined {
    return this.permissions.get(permissionId);
  }

  public getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  public getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  public getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  public getPermissionsByCategory(category: string): Permission[] {
    return Array.from(this.permissions.values()).filter(
      permission => permission.category === category
    );
  }

  // Utility Methods
  private getRequiredPermissions(resource: string, action: string): string[] {
    const permissionId = `${resource}.${action}`;
    if (this.permissions.has(permissionId)) {
      return [permissionId];
    }

    // Check for wildcard permissions
    const wildcardPermission = `${resource}.*`;
    if (this.permissions.has(wildcardPermission)) {
      return [wildcardPermission];
    }

    // Check resource hierarchy for inherited permissions
    const hierarchy = this.resourceHierarchy[resource];
    if (hierarchy?.parent) {
      const parentPermission = `${hierarchy.parent}.${action}`;
      if (this.permissions.has(parentPermission)) {
        return [parentPermission];
      }
    }

    return [permissionId]; // Return the expected permission even if not found
  }

  private isMFARequired(permissions: string[], context: AccessContext): boolean {
    // Check if any permission requires MFA
    const requiresMFA = permissions.some(permissionId => {
      const permission = this.permissions.get(permissionId);
      return permission?.requiresMFA;
    });

    if (requiresMFA) return true;

    // Check context-based MFA requirements
    if (context.riskScore > 70) return true;
    
    return false;
  }

  private async evaluateAccessConditions(request: AccessRequest, userRoles: UserRole[]): Promise<{ allowed: boolean; reason: string }> {
    // Evaluate role-specific conditions
    for (const userRole of userRoles) {
      if (userRole.conditions) {
        for (const condition of userRole.conditions) {
          const result = await this.evaluateCondition(condition, request.context);
          if (!result) {
            return { allowed: false, reason: `Role condition failed: ${condition.description}` };
          }
        }
      }
    }

    // Evaluate permission-specific conditions
    const requiredPermissions = this.getRequiredPermissions(request.resource, request.action);
    for (const permissionId of requiredPermissions) {
      const permission = this.permissions.get(permissionId);
      if (permission?.conditions) {
        for (const condition of permission.conditions) {
          const result = await this.evaluateCondition(condition, request.context);
          if (!result) {
            return { allowed: false, reason: `Permission condition failed: ${condition.description}` };
          }
        }
      }
    }

    return { allowed: true, reason: 'All conditions satisfied' };
  }

  private async evaluateCondition(condition: AccessCondition, context: AccessContext): Promise<boolean> {
    let contextValue: unknown;

    switch (condition.field) {
      case 'ipAddress':
        contextValue = context.ipAddress;
        break;
      case 'location.country':
        contextValue = context.location?.country;
        break;
      case 'time':
        contextValue = new Date().getHours();
        break;
      case 'riskScore':
        contextValue = context.riskScore;
        break;
      default:
        contextValue = context.additionalData?.[condition.field];
    }

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue);
      case 'greater_than':
        return contextValue > condition.value;
      case 'less_than':
        return contextValue < condition.value;
      case 'matches':
        return new RegExp(condition.value).test(contextValue);
      default:
        return false;
    }
  }

  private createAccessResult(
    granted: boolean,
    reason: string,
    request: AccessRequest,
    requiredPermissions: string[],
    missingPermissions: string[],
    startTime: number
  ): AccessResult {
    const result: AccessResult = {
      granted,
      reason,
      requiredPermissions,
      missingPermissions,
      auditData: {
        requestId: request.requestId,
        userId: request.userId,
        resource: request.resource,
        action: request.action,
        decision: granted ? 'granted' : 'denied',
        evaluationTime: performance.now() - startTime,
        appliedRoles: [],
        appliedPermissions: []
      }
    };

    // Add to audit log
    this.accessLog.push(result);
    
    // Keep only last 1000 entries
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-1000);
    }

    // Emit access event
    this.emit('accessEvaluated', result);

    return result;
  }

  private async getDefaultContext(): Promise<AccessContext> {
    return {
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      deviceFingerprint: 'unknown',
      sessionId: 'unknown',
      mfaVerified: false,
      riskScore: 0
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPeriodicCleanup(): void {
    // Clean up expired roles every hour
    setInterval(() => {
      this.cleanupExpiredRoles();
    }, 60 * 60 * 1000);
  }

  private cleanupExpiredRoles(): void {
    const now = new Date();
    
    for (const [userId, userRoles] of this.userRoles.entries()) {
      userRoles.forEach(role => {
        if (role.expiresAt && role.expiresAt < now && role.isActive) {
          role.isActive = false;
          this.emit('roleExpired', { userId, roleId: role.roleId });
        }
      });
    }
  }

  // Event System
  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[RBAC] Event listener error:', error);
      }
    });
  }

  public onRoleAssigned(callback: (...args: unknown[]) => void): () => void {
    if (!this.eventListeners.has('roleAssigned')) {
      this.eventListeners.set('roleAssigned', []);
    }
    this.eventListeners.get('roleAssigned')!.push(callback);
    
    return () => {
      const listeners = this.eventListeners.get('roleAssigned');
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      }
    };
  }

  public onAccessEvaluated(callback: (...args: unknown[]) => void): () => void {
    if (!this.eventListeners.has('accessEvaluated')) {
      this.eventListeners.set('accessEvaluated', []);
    }
    this.eventListeners.get('accessEvaluated')!.push(callback);
    
    return () => {
      const listeners = this.eventListeners.get('accessEvaluated');
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      }
    };
  }

  // Admin Methods
  public getAccessLog(): AccessResult[] {
    return [...this.accessLog];
  }

  public getAccessStatistics(): {
    totalRequests: number;
    grantedRequests: number;
    deniedRequests: number;
    averageEvaluationTime: number;
  } {
    const total = this.accessLog.length;
    const granted = this.accessLog.filter(log => log.granted).length;
    const denied = total - granted;
    const avgTime = total > 0 ? 
      this.accessLog.reduce((sum, log) => sum + log.auditData.evaluationTime, 0) / total : 0;

    return {
      totalRequests: total,
      grantedRequests: granted,
      deniedRequests: denied,
      averageEvaluationTime: avgTime
    };
  }
}

// Singleton instance
export { RBACManager };
export const rbacManager = new RBACManager();
export default rbacManager;