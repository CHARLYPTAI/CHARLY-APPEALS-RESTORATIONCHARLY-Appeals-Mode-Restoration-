import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { RolePermissions } from '../pages/RolePermissions';
import { RoleList } from '../components/roles/RoleList';
import { RoleEditor } from '../components/roles/RoleEditor';
import { PermissionMatrix } from '../components/roles/PermissionMatrix';
import { ImportExportControls } from '../components/roles/ImportExportControls';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-blob-url'),
    revokeObjectURL: jest.fn(),
  },
});

// Sample test data
const mockRoles = [
  {
    id: '1',
    name: 'Property Manager',
    description: 'Manages property data and appeals',
    scope: 'tenant' as const,
    permissions: ['property:read', 'property:write', 'appeals:read'],
    version: 1,
    lastEditor: 'admin@test.com',
    lastModified: '2024-01-15T10:30:00Z',
    tenantType: 'COMMERCIAL' as const,
  },
  {
    id: '2',
    name: 'System Administrator',
    description: 'Full system access',
    scope: 'global' as const,
    permissions: ['admin:system:read', 'admin:system:write', 'admin:users:read', 'admin:users:write'],
    version: 2,
    lastEditor: 'superadmin@test.com',
    lastModified: '2024-01-14T15:45:00Z',
  },
];

const mockPermissions = [
  {
    id: 'admin:system:read',
    name: 'System Read',
    category: 'admin_system',
    description: 'Read system configuration',
    isSystem: true,
  },
  {
    id: 'admin:system:write',
    name: 'System Write',
    category: 'admin_system',
    description: 'Modify system configuration',
    isSystem: true,
  },
  {
    id: 'admin:users:read',
    name: 'Users Read',
    category: 'admin_users',
    description: 'View user accounts',
    isSystem: false,
  },
  {
    id: 'admin:users:write',
    name: 'Users Write',
    category: 'admin_users',
    description: 'Create and modify user accounts',
    isSystem: false,
  },
  {
    id: 'property:read',
    name: 'Property Read',
    category: 'property_read',
    description: 'View property data',
    isSystem: false,
  },
  {
    id: 'property:write',
    name: 'Property Write',
    category: 'property_write',
    description: 'Create and modify property data',
    isSystem: false,
  },
  {
    id: 'appeals:read',
    name: 'Appeals Read',
    category: 'appeals_read',
    description: 'View appeal cases',
    isSystem: false,
  },
];

describe('RolePermissions Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/admin/roles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ roles: mockRoles }),
        });
      }
      if (url.includes('/api/admin/permissions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ permissions: mockPermissions }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  test('loads and displays roles and permissions', async () => {
    render(<RolePermissions />);

    // Check loading state
    expect(screen.getByText('Loading roles and permissions...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Roles & Permissions')).toBeInTheDocument();
    });

    // Verify API calls
    expect(fetch).toHaveBeenCalledWith('/api/admin/roles', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer mock-token',
      }),
    }));
    expect(fetch).toHaveBeenCalledWith('/api/admin/permissions', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer mock-token',
      }),
    }));
  });

  test('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<RolePermissions />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Roles')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Test retry button
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    // Should reload the page (window.location.reload is called)
  });

  test('opens role editor for creating new roles', async () => {
    render(<RolePermissions />);

    await waitFor(() => {
      expect(screen.getByText('Create Role')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Role');
    fireEvent.click(createButton);

    // Should open the role editor
    await waitFor(() => {
      expect(screen.getByText('Create New Role')).toBeInTheDocument();
    });
  });
});

describe('RoleList Component', () => {
  const mockOnEditRole = jest.fn();
  const mockOnDeleteRole = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays roles in table format', () => {
    render(
      <RoleList
        roles={mockRoles}
        onEditRole={mockOnEditRole}
        onDeleteRole={mockOnDeleteRole}
      />
    );

    // Check table headers
    expect(screen.getByText('Role Name')).toBeInTheDocument();
    expect(screen.getByText('Scope')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(screen.getByText('Last Updated')).toBeInTheDocument();

    // Check role data
    expect(screen.getByText('Property Manager')).toBeInTheDocument();
    expect(screen.getByText('System Administrator')).toBeInTheDocument();
    expect(screen.getByText('3 permissions')).toBeInTheDocument();
    expect(screen.getByText('4 permissions')).toBeInTheDocument();
  });

  test('filters roles by search term', async () => {
    const user = userEvent.setup();
    
    render(
      <RoleList
        roles={mockRoles}
        onEditRole={mockOnEditRole}
        onDeleteRole={mockOnDeleteRole}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search roles by name or description...');
    await user.type(searchInput, 'Property');

    // Should only show Property Manager role
    expect(screen.getByText('Property Manager')).toBeInTheDocument();
    expect(screen.queryByText('System Administrator')).not.toBeInTheDocument();
  });

  test('filters roles by scope', async () => {
    const user = userEvent.setup();
    
    render(
      <RoleList
        roles={mockRoles}
        onEditRole={mockOnEditRole}
        onDeleteRole={mockOnDeleteRole}
      />
    );

    const scopeFilter = screen.getByDisplayValue('All Scopes');
    await user.selectOptions(scopeFilter, 'global');

    // Should only show global roles
    expect(screen.queryByText('Property Manager')).not.toBeInTheDocument();
    expect(screen.getByText('System Administrator')).toBeInTheDocument();
  });

  test('handles edit and delete actions', async () => {
    const user = userEvent.setup();
    
    render(
      <RoleList
        roles={mockRoles}
        onEditRole={mockOnEditRole}
        onDeleteRole={mockOnDeleteRole}
      />
    );

    // Test edit action
    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);
    expect(mockOnEditRole).toHaveBeenCalledWith(mockRoles[0]);

    // Test delete action (requires confirmation)
    window.confirm = jest.fn(() => true);
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete the role "Property Manager"? This action cannot be undone.'
    );
    expect(mockOnDeleteRole).toHaveBeenCalledWith('1');
  });

  test('paginates results correctly', async () => {
    const manyRoles = Array.from({ length: 25 }, (_, i) => ({
      ...mockRoles[0],
      id: `role-${i}`,
      name: `Role ${i + 1}`,
    }));

    render(
      <RoleList
        roles={manyRoles}
        onEditRole={mockOnEditRole}
        onDeleteRole={mockOnDeleteRole}
      />
    );

    // Should show pagination controls
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 to 10 of 25 results')).toBeInTheDocument();

    // Test next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });
});

describe('RoleEditor Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  test('renders create mode correctly', () => {
    render(
      <RoleEditor
        role={null}
        permissions={mockPermissions}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Create New Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Role Name *')).toHaveValue('');
    expect(screen.getByLabelText('Description *')).toHaveValue('');
  });

  test('renders edit mode with existing role data', () => {
    render(
      <RoleEditor
        role={mockRoles[0]}
        permissions={mockPermissions}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Edit Role')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Property Manager')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Manages property data and appeals')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <RoleEditor
        role={null}
        permissions={mockPermissions}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('Create Role');
    await user.click(saveButton);

    // Should show validation errors
    expect(screen.getByText('Role name is required')).toBeInTheDocument();
    expect(screen.getByText('Role description is required')).toBeInTheDocument();
    expect(screen.getByText('At least one permission must be selected')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('saves role with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <RoleEditor
        role={null}
        permissions={mockPermissions}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Fill in form data
    await user.type(screen.getByLabelText('Role Name *'), 'Test Role');
    await user.type(screen.getByLabelText('Description *'), 'Test description');
    await user.type(screen.getByLabelText('Change Notes *'), 'Creating new role');

    // Select a permission
    const permissionCheckbox = screen.getByRole('checkbox', { name: /Users Read/ });
    await user.click(permissionCheckbox);

    const saveButton = screen.getByText('Create Role');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      name: 'Test Role',
      description: 'Test description',
      scope: 'tenant',
      permissions: ['admin:users:read'],
      tenantType: 'COMMERCIAL',
      changeNotes: 'Creating new role',
    });
  });
});

describe('PermissionMatrix Component', () => {
  const mockOnPermissionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('groups permissions by category', () => {
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        selectedPermissions={[]}
        onPermissionChange={mockOnPermissionChange}
        roleScope="global"
      />
    );

    // Should show category groups
    expect(screen.getByText('Admin System')).toBeInTheDocument();
    expect(screen.getByText('Admin Users')).toBeInTheDocument();
    expect(screen.getByText('Property Read')).toBeInTheDocument();
  });

  test('filters system permissions for tenant roles', () => {
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        selectedPermissions={[]}
        onPermissionChange={mockOnPermissionChange}
        roleScope="tenant"
        tenantType="COMMERCIAL"
      />
    );

    // System permissions should not be visible for tenant roles
    expect(screen.queryByText('System Read')).not.toBeInTheDocument();
    expect(screen.queryByText('System Write')).not.toBeInTheDocument();
    
    // Non-system permissions should be visible
    expect(screen.getByText('Users Read')).toBeInTheDocument();
    expect(screen.getByText('Property Read')).toBeInTheDocument();
  });

  test('handles individual permission selection', async () => {
    const user = userEvent.setup();
    
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        selectedPermissions={[]}
        onPermissionChange={mockOnPermissionChange}
        roleScope="global"
      />
    );

    const permissionCheckbox = screen.getByRole('checkbox', { name: /Users Read/ });
    await user.click(permissionCheckbox);

    expect(mockOnPermissionChange).toHaveBeenCalledWith(['admin:users:read']);
  });

  test('handles group selection', async () => {
    const user = userEvent.setup();
    
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        selectedPermissions={[]}
        onPermissionChange={mockOnPermissionChange}
        roleScope="global"
      />
    );

    // Find and click group checkbox for admin_users category
    const groupCheckboxes = screen.getAllByRole('button');
    const adminUsersGroup = groupCheckboxes.find(button => 
      button.querySelector('[class*="border-2"]')
    );
    
    if (adminUsersGroup) {
      await user.click(adminUsersGroup);
      // Should select all permissions in the admin_users category
      expect(mockOnPermissionChange).toHaveBeenCalledWith(['admin:users:read', 'admin:users:write']);
    }
  });

  test('handles select all functionality', async () => {
    const user = userEvent.setup();
    
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        selectedPermissions={[]}
        onPermissionChange={mockOnPermissionChange}
        roleScope="global"
      />
    );

    const selectAllButton = screen.getByText('Select All');
    await user.click(selectAllButton);

    // Should select all available permissions
    expect(mockOnPermissionChange).toHaveBeenCalledWith(
      mockPermissions.map(p => p.id)
    );
  });
});

describe('ImportExportControls Component', () => {
  const mockOnImport = jest.fn();
  const mockOnExport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnImport.mockResolvedValue({ imported: 1, skipped: 0, conflicts: [], errors: [] });
  });

  test('renders import and export buttons', () => {
    render(
      <ImportExportControls
        roles={mockRoles}
        onImport={mockOnImport}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  test('opens export modal and allows role selection', async () => {
    const user = userEvent.setup();
    
    render(
      <ImportExportControls
        roles={mockRoles}
        onImport={mockOnImport}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getByText('Export');
    await user.click(exportButton);

    // Should open export modal
    expect(screen.getByText('Export Roles')).toBeInTheDocument();
    expect(screen.getByText('Select Roles (0 of 2 selected)')).toBeInTheDocument();

    // Select a role
    const roleCheckbox = screen.getByRole('checkbox', { name: /Property Manager/ });
    await user.click(roleCheckbox);

    // Export selected roles
    const exportSelectedButton = screen.getByText('Export Selected');
    await user.click(exportSelectedButton);

    expect(mockOnExport).toHaveBeenCalledWith(['1']);
  });

  test('handles file import with validation', async () => {
    const user = userEvent.setup();
    
    render(
      <ImportExportControls
        roles={mockRoles}
        onImport={mockOnImport}
        onExport={mockOnExport}
      />
    );

    const importButton = screen.getByText('Import');
    await user.click(importButton);

    // Should open import modal
    expect(screen.getByText('Import Roles')).toBeInTheDocument();

    // Test file selection
    const fileInput = screen.getByLabelText('Select File');
    const mockFile = new File(
      [JSON.stringify({ roles: [{ name: 'Test Role', description: 'Test', scope: 'tenant', permissions: ['test'] }] })],
      'roles.json',
      { type: 'application/json' }
    );

    await user.upload(fileInput, mockFile);

    // Should show file validation result
    await waitFor(() => {
      expect(screen.getByText('Found 1 valid role in the file')).toBeInTheDocument();
    });

    // Import the roles
    const importRolesButton = screen.getByText('Import Roles');
    await user.click(importRolesButton);

    expect(mockOnImport).toHaveBeenCalledWith({
      roles: [{ name: 'Test Role', description: 'Test', scope: 'tenant', permissions: ['test'] }],
      conflictResolution: 'rename',
    });
  });

  test('validates file format and shows errors', async () => {
    const user = userEvent.setup();
    
    render(
      <ImportExportControls
        roles={mockRoles}
        onImport={mockOnImport}
        onExport={mockOnExport}
      />
    );

    const importButton = screen.getByText('Import');
    await user.click(importButton);

    // Test invalid file type
    const fileInput = screen.getByLabelText('Select File');
    const invalidFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' });

    await user.upload(fileInput, invalidFile);
    expect(screen.getByText('Please select a JSON file')).toBeInTheDocument();

    // Test invalid JSON
    const invalidJsonFile = new File(['{ invalid json }'], 'invalid.json', { type: 'application/json' });
    await user.upload(fileInput, invalidJsonFile);

    await waitFor(() => {
      expect(screen.getByText(/Failed to parse JSON file/)).toBeInTheDocument();
    });
  });

  test('displays import results', async () => {
    const user = userEvent.setup();
    mockOnImport.mockResolvedValue({
      imported: 2,
      skipped: 1,
      conflicts: ['Role "Test" renamed to "Test (1)"'],
      errors: [],
    });

    render(
      <ImportExportControls
        roles={mockRoles}
        onImport={mockOnImport}
        onExport={mockOnExport}
      />
    );

    const importButton = screen.getByText('Import');
    await user.click(importButton);

    const fileInput = screen.getByLabelText('Select File');
    const mockFile = new File(
      [JSON.stringify({ roles: [{ name: 'Test Role', description: 'Test', scope: 'tenant', permissions: ['test'] }] })],
      'roles.json',
      { type: 'application/json' }
    );

    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByText('Import Roles')).toBeInTheDocument();
    });

    const importRolesButton = screen.getByText('Import Roles');
    await user.click(importRolesButton);

    // Should show import results
    await waitFor(() => {
      expect(screen.getByText('Import Completed')).toBeInTheDocument();
      expect(screen.getByText('Imported: 2 roles')).toBeInTheDocument();
      expect(screen.getByText('Skipped: 1 roles')).toBeInTheDocument();
      expect(screen.getByText('Conflicts resolved: 1')).toBeInTheDocument();
    });
  });
});