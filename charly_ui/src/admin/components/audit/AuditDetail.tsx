import React, { useState } from 'react';
import { AuditLogEntry } from './AuditTable';

interface AuditDetailProps {
  log: AuditLogEntry;
  onCorrelationFilter: (correlationId: string) => void;
}

export function AuditDetail({ log, onCorrelationFilter }: AuditDetailProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const redactPII = (data: any): any => {
    if (typeof data === 'string') {
      // Redact email addresses - show first 2 and last 2 characters before @
      if (data.includes('@') && data.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        const [local, domain] = data.split('@');
        if (local.length > 4) {
          return `${local.slice(0, 2)}...${local.slice(-2)}@${domain}`;
        }
      }
      
      // Redact potential tokens (long alphanumeric strings)
      if (data.match(/^[A-Za-z0-9+/]{32,}={0,2}$/) || data.match(/^[A-Za-z0-9_-]{20,}$/)) {
        return `${data.slice(0, 8)}...${data.slice(-4)}`;
      }
      
      // Redact potential passwords or secrets
      if (data.toLowerCase().includes('password') || data.toLowerCase().includes('secret') || data.toLowerCase().includes('token')) {
        return '[REDACTED]';
      }
      
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(redactPII);
    }
    
    if (data && typeof data === 'object') {
      const redacted: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('secret') || 
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('key')) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = redactPII(value);
        }
      }
      return redacted;
    }
    
    return data;
  };

  const anonymizeIP = (ip: string): string => {
    if (!ip) return '';
    
    // IPv4 anonymization - zero out last octet
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
    }
    
    // IPv6 anonymization - zero out last 64 bits
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return `${parts.slice(0, 4).join(':')}::xxxx`;
      }
    }
    
    return 'xxx.xxx.xxx.xxx';
  };

  const CopyButton = ({ text, fieldName, className = "" }: { text: string; fieldName: string; className?: string }) => (
    <button
      onClick={() => copyToClipboard(text, fieldName)}
      className={`ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${className}`}
      title={`Copy ${fieldName}`}
    >
      {copiedField === fieldName ? (
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );

  const generateDeepLink = (correlationId: string): string => {
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = `cid=${correlationId}`;
    return currentUrl.toString();
  };

  return (
    <div className="space-y-4 text-sm max-w-full">
      {/* Event Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Correlation ID with Deep Link */}
        {log.correlationId && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-800 dark:text-blue-300">Correlation ID</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onCorrelationFilter(log.correlationId!)}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-300 text-xs rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                  title="Filter by this correlation ID"
                >
                  Filter Events
                </button>
                <CopyButton 
                  text={generateDeepLink(log.correlationId)} 
                  fieldName="deep-link" 
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
            </div>
            <div className="font-mono text-blue-600 dark:text-blue-400 text-xs mt-1 break-all">
              {log.correlationId}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Use correlation ID to trace related events in this session
            </div>
          </div>
        )}

        {/* Request Details */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Request Information</span>
          
          {log.method && log.route && (
            <div className="mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Method & Route:</span>
              <div className="font-mono text-xs mt-1">
                <span className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded mr-2">{log.method}</span>
                {log.route}
                <CopyButton text={`${log.method} ${log.route}`} fieldName="route" />
              </div>
            </div>
          )}

          {log.ipAddress && (
            <div className="mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">IP Address (anonymized):</span>
              <div className="font-mono text-xs mt-1 flex items-center">
                {anonymizeIP(log.ipAddress)}
                <CopyButton text={log.ipAddress} fieldName="ip" />
              </div>
            </div>
          )}

          {log.userAgent && (
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">User Agent:</span>
              <div className="text-xs mt-1 break-all">
                {log.userAgent.length > 80 ? `${log.userAgent.slice(0, 80)}...` : log.userAgent}
                <CopyButton text={log.userAgent} fieldName="user-agent" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resource Information */}
      {(log.resourceType || log.resourceId) && (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Resource Information</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {log.resourceType && (
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Type:</span>
                <div className="text-sm text-gray-900 dark:text-gray-100">{log.resourceType}</div>
              </div>
            )}
            {log.resourceId && (
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Resource ID:</span>
                <div className="font-mono text-sm text-gray-900 dark:text-gray-100 flex items-center">
                  {log.resourceId}
                  <CopyButton text={log.resourceId} fieldName="resource-id" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Details */}
      {log.details && (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Event Details</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 px-2 py-1 rounded">
                PII Redacted
              </span>
              <CopyButton text={JSON.stringify(log.details, null, 2)} fieldName="details" />
            </div>
          </div>
          <pre className="text-xs overflow-x-auto bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
{JSON.stringify(redactPII(log.details), null, 2)}
          </pre>
        </div>
      )}

      {/* Retention Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">Data Retention & Privacy Notice</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Audit logs are retained for 180 days. Sensitive information (passwords, tokens, emails) is redacted for security. 
              IP addresses are anonymized for privacy compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Event Timeline Context */}
      {log.correlationId && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium text-indigo-800 dark:text-indigo-300 text-xs">Event Tracing</span>
          </div>
          <p className="text-xs text-indigo-700 dark:text-indigo-400">
            This event is part of a traced session. Click "Filter Events" above to see all related activities 
            within a ±5 minute window, or use the correlation ID to investigate the complete user journey.
          </p>
        </div>
      )}
    </div>
  );
}