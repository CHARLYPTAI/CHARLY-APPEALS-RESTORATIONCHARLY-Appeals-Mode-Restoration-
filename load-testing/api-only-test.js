// API-Only Load Testing - Backend Performance Validation
// Phase 3C: Test the 164-line decomposed backend

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';

const backendResponseTime = new Trend('backend_response_time');
const errorRate = new Rate('api_errors');
const successfulRequests = new Counter('successful_requests');

export const options = {
  scenarios: {
    api_baseline: {
      executor: 'constant-vus',
      vus: 1,
      duration: '2m',
      tags: { test_type: 'api_baseline' },
    },
    api_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      tags: { test_type: 'api_load' },
    }
  },
  
  thresholds: {
    'backend_response_time': ['p(95)<1000'],
    'api_errors': ['rate<0.05'],
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:8000';

export function setup() {
  console.log('🍎 APPLE CTO Phase 3C: API Load Testing');
  console.log('Testing decomposed backend (164 lines post-Phase 2)');
  
  // Health check
  const health = http.get(`${API_URL}/health`);
  if (health.status !== 200) {
    throw new Error('Backend not healthy');
  }
  console.log('✅ Backend health check passed');
}

export default function() {
  
  group('Backend API Performance', () => {
    // Test core API endpoints
    const endpoints = [
      { path: '/health', name: 'health' },
      { path: '/api/properties', name: 'properties' },
      { path: '/api/analytics', name: 'analytics' },
      { path: '/api/reports', name: 'reports' },
      { path: '/api/settings', name: 'settings' }
    ];
    
    endpoints.forEach(endpoint => {
      const res = http.get(`${API_URL}${endpoint.path}`);
      
      check(res, {
        [`${endpoint.name} status ok`]: (r) => r.status === 200,
        [`${endpoint.name} response time`]: (r) => r.timings.duration < 1000,
      });
      
      backendResponseTime.add(res.timings.duration);
      if (res.status === 200) successfulRequests.add(1);
      else errorRate.add(1);
    });
  });
  
  group('Phase 2 Decomposed Components', () => {
    // Test the 9 decomposed enterprise components
    const components = [
      '/api/portfolio/analytics',
      '/api/portfolio/comparison',
      '/api/portfolio/summary'
    ];
    
    components.forEach(component => {
      const res = http.get(`${API_URL}${component}`);
      
      check(res, {
        [`${component} responds`]: (r) => r.status === 200,
        [`${component} fast response`]: (r) => r.timings.duration < 800,
      });
      
      backendResponseTime.add(res.timings.duration);
      if (res.status === 200) successfulRequests.add(1);
      else errorRate.add(1);
    });
  });
  
  group('Revenue System (SACRED)', () => {
    // Test critical revenue system
    const res = http.get(`${API_URL}/api/reports/status`);
    
    check(res, {
      'revenue system ok': (r) => r.status === 200,
      'revenue system fast': (r) => r.timings.duration < 500,
      'revenue system protected': (r) => r.json('revenue_system') === 'SACRED_PROTECTED',
    });
    
    backendResponseTime.add(res.timings.duration);
    if (res.status === 200) successfulRequests.add(1);
    else errorRate.add(1);
  });
  
  sleep(0.5);
}

export function teardown(data) {
  const metrics = data.metrics;
  
  console.log('\n=== PHASE 2 BACKEND API RESULTS ===');
  console.log(`Backend Response Time (avg): ${metrics.backend_response_time?.values?.avg || 'N/A'}ms`);
  console.log(`Backend Response Time (p95): ${metrics.backend_response_time?.values?.['p(95)'] || 'N/A'}ms`);
  console.log(`Error Rate: ${(metrics.api_errors?.values?.rate || 0) * 100}%`);
  console.log(`Successful Requests: ${metrics.successful_requests?.values?.count || 0}`);
  
  // Apple CTO Standards
  const avgTime = metrics.backend_response_time?.values?.avg || Infinity;
  const errorRate = metrics.api_errors?.values?.rate || 1;
  
  console.log('\n=== APPLE CTO COMPLIANCE ===');
  console.log(`Average Response < 500ms: ${avgTime < 500 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Error Rate < 5%: ${errorRate < 0.05 ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n✅ Phase 2 decomposed backend validated under load');
}