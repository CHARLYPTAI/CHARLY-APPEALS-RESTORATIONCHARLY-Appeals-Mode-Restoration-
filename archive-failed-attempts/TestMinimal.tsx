import React from 'react';

export default function TestMinimal() {
  console.log("🧪 MINIMAL COMPONENT LOADED");
  
  return (
    <div style={{ 
      padding: '40px', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', 
      minHeight: '100vh' 
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        border: '2px solid #10b981'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#111827',
          margin: '0 0 16px 0'
        }}>
          🍎 MINIMAL REACT TEST
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          margin: '0 0 24px 0'
        }}>
          This is the simplest possible React component with zero V2 dependencies.
        </p>
        
        <div style={{
          padding: '20px',
          backgroundColor: '#dbeafe',
          borderRadius: '8px',
          border: '2px dashed #3b82f6'
        }}>
          <p style={{
            fontSize: '16px',
            color: '#1e40af',
            fontWeight: '500',
            margin: 0
          }}>
            ✅ If you see this, React is working
            <br />
            ⚡ Check browser console for log message
            <br />
            🎯 This proves React components can render
          </p>
        </div>
      </div>
    </div>
  );
}