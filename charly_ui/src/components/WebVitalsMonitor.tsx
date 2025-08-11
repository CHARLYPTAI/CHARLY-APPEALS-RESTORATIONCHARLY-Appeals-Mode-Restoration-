// ============================================================================
// CHARLY PLATFORM - WEB VITALS MONITORING COMPONENT
// Apple CTO Phase 3D - Core Web Vitals Implementation
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { onCLS, onFCP, onFID, onLCP, onTTFB, Metric } from 'web-vitals';
import { performanceMonitor } from '../services/performanceMonitoringService';

interface WebVitalsData {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

interface WebVitalsMonitorProps {
  enabled?: boolean;
  debug?: boolean;
}

// Apple CTO Performance Thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }  // Time to First Byte
};

export const WebVitalsMonitor: React.FC<WebVitalsMonitorProps> = ({ 
  enabled = true, 
  debug = false 
}) => {
  const vitalsData = useRef<WebVitalsData>({});
  const reportingSent = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Function to send vitals to backend
    const sendVitalsToBackend = async (vitals: WebVitalsData) => {
      try {
        const response = await fetch('/api/metrics/web-vitals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...vitals,
            timestamp: Date.now(),
            url: window.location.href,
            device_type: getDeviceType()
          })
        });

        if (!response.ok) {
          console.warn('Failed to send Web Vitals data:', response.statusText);
        } else {
          const result = await response.json();
          if (debug && result.alerts?.length > 0) {
            console.warn('🚨 Web Vitals Alerts:', result.alerts);
          }
        }
      } catch (error) {
        console.warn('Error sending Web Vitals data:', error);
      }
    };

    // Function to handle metric reporting
    const handleMetric = (metric: Metric) => {
      const { name, value, rating } = metric;
      
      if (debug) {
        const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
        const status = threshold ? 
          (value <= threshold.good ? '✅' : value <= threshold.poor ? '⚠️' : '❌') : 
          'ℹ️';
        
        console.log(`${status} ${name}: ${value.toFixed(2)}ms (${rating})`);
      }

      // Store metric value
      vitalsData.current[name.toLowerCase() as keyof WebVitalsData] = value;

      // Record in performance monitor
      performanceMonitor.recordMetric(name.toLowerCase(), value, {
        rating,
        url: window.location.pathname
      });

      // Check if we have enough metrics to send (we'll send after each metric)
      sendVitalsToBackend(vitalsData.current);
    };

    // Initialize Web Vitals collection
    if (debug) {
      console.log('🔍 Initializing Web Vitals monitoring...');
    }

    // Largest Contentful Paint
    onLCP(handleMetric);
    
    // First Input Delay
    onFID(handleMetric);
    
    // Cumulative Layout Shift
    onCLS(handleMetric);
    
    // First Contentful Paint
    onFCP(handleMetric);
    
    // Time to First Byte
    onTTFB(handleMetric);

    // Send final report when page unloads
    const handleBeforeUnload = () => {
      if (!reportingSent.current && Object.keys(vitalsData.current).length > 0) {
        // Use sendBeacon for reliable reporting on page unload
        const data = JSON.stringify({
          ...vitalsData.current,
          timestamp: Date.now(),
          url: window.location.href,
          device_type: getDeviceType(),
          final_report: true
        });

        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/metrics/web-vitals', data);
        }
        
        reportingSent.current = true;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, debug]);

  // This component doesn't render anything visible
  return null;
};

// Helper function to determine device type
function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipad|phone|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  
  return 'desktop';
}

// Hook for programmatic Web Vitals monitoring
// eslint-disable-next-line react-refresh/only-export-components
export function useWebVitals(options: { enabled?: boolean; onMetric?: (metric: Metric) => void } = {}) {
  const { enabled = true, onMetric } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleMetric = (metric: Metric) => {
      // Record in performance monitor
      performanceMonitor.recordMetric(metric.name.toLowerCase(), metric.value, {
        rating: metric.rating,
        url: window.location.pathname
      });

      // Call custom handler if provided
      if (onMetric) {
        onMetric(metric);
      }
    };

    // Collect all Web Vitals
    onLCP(handleMetric);
    onFID(handleMetric);
    onCLS(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);
  }, [enabled, onMetric]);
}

// Component for displaying Web Vitals dashboard (for development/debugging)
export const WebVitalsDashboard: React.FC = () => {
  const [vitals, setVitals] = React.useState<Record<string, {value: number; rating: string; timestamp: number}>>({});

  useWebVitals({
    onMetric: (metric) => {
      setVitals(prev => ({
        ...prev,
        [metric.name]: {
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now()
        }
      }));
    }
  });

  if (Object.keys(vitals).length === 0) {
    return (
      <div className="web-vitals-dashboard">
        <h3>🔍 Web Vitals Monitoring</h3>
        <p>Collecting metrics...</p>
      </div>
    );
  }

  return (
    <div className="web-vitals-dashboard" style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: '#f0f0f0', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <h4>🚀 Web Vitals (Phase 3D)</h4>
      {Object.entries(vitals).map(([name, data]) => {
        const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
        const status = threshold ? 
          (data.value <= threshold.good ? '✅' : data.value <= threshold.poor ? '⚠️' : '❌') : 
          'ℹ️';
        
        return (
          <div key={name} style={{ marginBottom: '5px' }}>
            {status} <strong>{name}</strong>: {data.value.toFixed(2)}ms ({data.rating})
          </div>
        );
      })}
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        Apple CTO Phase 3D Monitoring
      </div>
    </div>
  );
};

export default WebVitalsMonitor;