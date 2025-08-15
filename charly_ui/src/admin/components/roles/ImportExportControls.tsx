import React, { useState, useRef } from 'react';
import type { Role } from '../../pages/RolePermissions';

interface ImportExportControlsProps {
  roles: Role[];
  onImport: (data: { roles: Partial<Role>[], conflictResolution: 'rename' | 'overwrite' | 'skip' }) => Promise<any>;
  onExport: (roleIds: string[]) => void;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  conflicts: string[];
  errors: string[];
}

export function ImportExportControls({ roles, onImport, onExport }: ImportExportControlsProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<Partial<Role>[] | null>(null);
  const [conflictResolution, setConflictResolution] = useState<'rename' | 'overwrite' | 'skip'>('rename');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportClick = () => {
    setSelectedRoles([]);
    setShowExportModal(true);
  };

  const handleImportClick = () => {
    setImportFile(null);
    setImportData(null);
    setImportResult(null);
    setError(null);
    setShowImportModal(true);
  };

  const handleExportConfirm = () => {
    if (selectedRoles.length === 0) {
      setError('Please select at least one role to export');
      return;
    }
    
    onExport(selectedRoles);
    setShowExportModal(false);
    setError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please select a JSON file');
      return;
    }

    setImportFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!parsed.roles || !Array.isArray(parsed.roles)) {
          throw new Error('Invalid file format. Expected an object with a "roles" array.');
        }

        // Validate role structure
        const validRoles = parsed.roles.filter((role: any) => {
          return role.name && role.description && role.scope && Array.isArray(role.permissions);
        });

        if (validRoles.length === 0) {
          throw new Error('No valid roles found in the file');
        }

        setImportData(validRoles);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse JSON file');
        setImportData(null);
      }
    };

    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    if (!importData) {
      setError('No valid import data available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onImport({
        roles: importData,
        conflictResolution
      });

      setImportResult({
        success: true,
        imported: result.imported || importData.length,
        skipped: result.skipped || 0,
        conflicts: result.conflicts || [],
        errors: result.errors || []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        conflicts: [],
        errors: [err instanceof Error ? err.message : 'Unknown error']
      });
    } finally {
      setLoading(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportData(null);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRoles(
      selectedRoles.length === roles.length ? [] : roles.map(r => r.id)
    );
  };

  return (
    <>
      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleImportClick}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Import
        </button>
        
        <button
          onClick={handleExportClick}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Export
        </button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowExportModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Export Roles</h3>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Roles ({selectedRoles.length} of {roles.length} selected)
                    </label>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      {selectedRoles.length === roles.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded">
                    {roles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          onChange={() => handleRoleToggle(role.id)}
                          className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{role.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{role.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExportConfirm}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Export Selected
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeImportModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Import Roles</h3>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {importResult ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${
                      importResult.success 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}>
                      <h4 className={`font-medium ${
                        importResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                      }`}>
                        Import {importResult.success ? 'Completed' : 'Failed'}
                      </h4>
                      <div className={`text-sm mt-2 space-y-1 ${
                        importResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        <p>Imported: {importResult.imported} roles</p>
                        {importResult.skipped > 0 && <p>Skipped: {importResult.skipped} roles</p>}
                        {importResult.conflicts.length > 0 && (
                          <div>
                            <p>Conflicts resolved: {importResult.conflicts.length}</p>
                            <ul className="list-disc list-inside pl-4">
                              {importResult.conflicts.map((conflict, index) => (
                                <li key={index} className="text-xs">{conflict}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {importResult.errors.length > 0 && (
                          <div>
                            <p>Errors:</p>
                            <ul className="list-disc list-inside pl-4">
                              {importResult.errors.map((error, index) => (
                                <li key={index} className="text-xs">{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={closeImportModal}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select File
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Upload a JSON file containing role definitions
                      </p>
                    </div>

                    {importData && (
                      <div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            Found {importData.length} valid role{importData.length !== 1 ? 's' : ''} in the file
                          </p>
                          <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 list-disc list-inside">
                            {importData.slice(0, 3).map((role, index) => (
                              <li key={index}>{role.name}</li>
                            ))}
                            {importData.length > 3 && (
                              <li>...and {importData.length - 3} more</li>
                            )}
                          </ul>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Conflict Resolution
                          </label>
                          <select
                            value={conflictResolution}
                            onChange={(e) => setConflictResolution(e.target.value as typeof conflictResolution)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="rename">Rename conflicting roles</option>
                            <option value="overwrite">Overwrite existing roles</option>
                            <option value="skip">Skip conflicting roles</option>
                          </select>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            How to handle roles with names that already exist
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={closeImportModal}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleImportConfirm}
                        disabled={!importData || loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading && (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        Import Roles
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}