// Baseline Performance Metrics Collection
// Phase 3C: Establish performance baseline for Phase 2 decomposed architecture

import { check, group } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';

// Metrics specifically for Phase 2 architecture validation
const componentResponseTime = new Trend('component_response_time');
const backendResponseTime = new Trend('backend_response_time'); 
const frontendResponseTime = new Trend('frontend_response_time');
const errorRate = new Rate('baseline_errors');
const successfulRequests = new Counter('successful_requests');

export const options = {
  scenarios: {
    baseline_measurement: {
      executor: 'constant-vus',
      vus: 1, // Single user baseline
      duration: '5m',
      tags: { test_type: 'baseline' },
    }
  },
  
  thresholds: {
    'component_response_time': ['p(95)<2000'],
    'backend_response_time': ['p(95)<1500'], 
    'frontend_response_time': ['p(95)<2000'],
    'baseline_errors': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:8000';

export function setup() {
  console.log('Establishing baseline metrics for Phase 2 decomposed architecture');
  console.log('Testing 443-line frontend and 164-line backend performance');
}

export default function() {
  
  group('Frontend Baseline - Phase 2 Decomposed Components', () => {
    // Test main portfolio page (443 lines post-decomposition)
    const portfolioStart = Date.now();
    const portfolioRes = http.get(`${BASE_URL}/portfolio`);
    
    check(portfolioRes, {
      'portfolio page loads': (r) => r.status === 200,
      'portfolio response time baseline': (r) => r.timings.duration < 3000,
    });
    
    frontendResponseTime.add(portfolioRes.timings.duration);
    if (portfolioRes.status === 200) successfulRequests.add(1);
    else errorRate.add(1);
    
    // Test main dashboard
    const dashboardRes = http.get(`${BASE_URL}/dashboard`);
    
    check(dashboardRes, {
      'dashboard loads': (r) => r.status === 200,
    });
    
    frontendResponseTime.add(dashboardRes.timings.duration);
    if (dashboardRes.status === 200) successfulRequests.add(1);
    else errorRate.add(1);
  });
  
  group('Backend API Baseline - 164 Lines Post-Decomposition', () => {
    // Test core API endpoints from decomposed backend
    const endpoints = [
      { path: '/api/properties', name: 'properties' },
      { path: '/api/analytics', name: 'analytics' },
      { path: '/api/reports', name: 'reports' },
      { path: '/api/settings', name: 'settings' }
    ];
    
    endpoints.forEach(endpoint => {
      const res = http.get(`${API_URL}${endpoint.path}`);
      
      check(res, {
        [`${endpoint.name} endpoint responds`]: (r) => r.status === 200 || r.status === 401,
        [`${endpoint.name} baseline timing`]: (r) => r.timings.duration < 2000,
      });
      
      backendResponseTime.add(res.timings.duration);
      if (res.status === 200) successfulRequests.add(1);
      else if (res.status >= 500) errorRate.add(1);
    });
  });
  
  group('Phase 2 Component Baseline', () => {
    // Test the 9 decomposed enterprise components
    const components = [
      '/api/portfolio/analytics',    // AnalyticsView component
      '/api/portfolio/comparison',   // ComparisonView component  
      '/api/portfolio/summary',      // PortfolioSummary component
      '/api/portfolio/properties',   // PropertyList component
      '/api/portfolio/filters'       // PropertyFilters component
    ];
    
    components.forEach(component => {
      const res = http.get(`${API_URL}${component}`);
      
      check(res, {
        [`${component} component baseline`]: (r) => r.status === 200 || r.status === 401,
        [`${component} performance baseline`]: (r) => r.timings.duration < 1500,
      });
      
      componentResponseTime.add(res.timings.duration);
      if (res.status === 200) successfulRequests.add(1);
      else if (res.status >= 500) errorRate.add(1);
    });
  });
  
  group('Revenue System Baseline - SACRED Protection', () => {
    // Test critical $99-$149 report generation system
    const revenueRes = http.get(`${API_URL}/api/reports/status`);
    
    check(revenueRes, {
      'revenue system accessible': (r) => r.status === 200 || r.status === 401,
      'revenue system baseline timing': (r) => r.timings.duration < 2000,
    });
    
    backendResponseTime.add(revenueRes.timings.duration);
    if (revenueRes.status === 200) successfulRequests.add(1);
    else if (revenueRes.status >= 500) errorRate.add(1);
  });
  
  // Baseline user behavior - minimal load
  sleep(1);
}

export function teardown(data) {
  console.log('Baseline metrics collection completed');
  
  const metrics = data.metrics;
  
  console.log('=== PHASE 2 ARCHITECTURE BASELINE METRICS ===');
  console.log(`Frontend Response Time (P95): ${metrics.frontend_response_time?.values?.['p(95)'] || 'N/A'}ms`);
  console.log(`Backend Response Time (P95): ${metrics.backend_response_time?.values?.['p(95)'] || 'N/A'}ms`);
  console.log(`Component Response Time (P95): ${metrics.component_response_time?.values?.['p(95)'] || 'N/A'}ms`);
  console.log(`Error Rate: ${(metrics.baseline_errors?.values?.rate || 0) * 100}%`);
  console.log(`Successful Requests: ${metrics.successful_requests?.values?.count || 0}`);
  
  // Apple CTO Standards Validation
  const frontendP95 = metrics.frontend_response_time?.values?.['p(95)'] || Infinity;
  const backendP95 = metrics.backend_response_time?.values?.['p(95)'] || Infinity;
  const errorRate = metrics.baseline_errors?.values?.rate || 1;
  
  console.log('\n=== APPLE CTO STANDARDS COMPLIANCE ===');
  console.log(`P95 < 2000ms: ${frontendP95 < 2000 && backendP95 < 2000 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Error Rate < 1%: ${errorRate < 0.01 ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\nBaseline established for Phase 3C load testing progression.');
}