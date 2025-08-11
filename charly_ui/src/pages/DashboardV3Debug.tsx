import React from 'react';

export default function DashboardV3Debug() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#007AFF' }}>
        🍎 CHARLY V2 IS WORKING!
      </h1>
      <p style={{ fontSize: '24px', color: '#666' }}>
        DashboardV3 Debug Page - Production Test
      </p>
      <div style={{ marginTop: '20px', padding: '20px', background: '#f0f0f0', borderRadius: '12px' }}>
        <h2>System Status:</h2>
        <ul>
          <li>✅ React App Loaded</li>
          <li>✅ DashboardV3 Route Active</li>
          <li>✅ Production Build Working</li>
          <li>✅ Timestamp: {new Date().toISOString()}</li>
        </ul>
      </div>
    </div>
  );
}