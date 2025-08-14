// K6 Load Testing Configuration for CHARLY Platform
// Phase 3C: Enterprise Load Testing & Validation

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for Phase 2 decomposed components
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const apiCalls = new Counter('api_calls');

// Load testing scenarios based on realistic user patterns
export const options = {
  scenarios: {
    // Baseline load - normal operation
    baseline: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      tags: { scenario: 'baseline' },
    },
    
    // Spike testing - sudden traffic increase
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },  // Ramp up
        { duration: '1m', target: 50 },  // Stay high
        { duration: '2m', target: 0 },   // Ramp down
      ],
      tags: { scenario: 'spike' },
    },
    
    // Stress testing - find breaking point
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },
        { duration: '10m', target: 100 },
        { duration: '5m', target: 0 },
      ],
      tags: { scenario: 'stress' },
    },
    
    // Endurance testing - sustained load
    endurance: {
      executor: 'constant-vus',
      vus: 25,
      duration: '30m',
      tags: { scenario: 'endurance' },
    }
  },
  
  thresholds: {
    // Apple CTO Performance Standards
    'http_req_duration': ['p(95)<2000'], // 95% under 2s
    'http_req_failed': ['rate<0.01'],    // Error rate < 1%
    'errors': ['rate<0.01'],
    'response_time': ['p(95)<2000', 'p(99)<5000'],
  },
};

// Base configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:8000';

// Test data for realistic scenarios
const testUsers = [
  { username: 'testuser1', password: 'password123' },
  { username: 'testuser2', password: 'password123' },
];

export function setup() {
  console.log('Starting CHARLY Platform Load Testing - Phase 3C');
  console.log(`Frontend URL: ${BASE_URL}`);
  console.log(`Backend API: ${API_URL}`);
}

export default function() {
  group('User Authentication Flow', () => {
    // Test login endpoint (critical for revenue protection)
    const loginRes = http.post(`${API_URL}/auth/login`, {
      username: testUsers[Math.floor(Math.random() * testUsers.length)].username,
      password: 'password123'
    });
    
    check(loginRes, {
      'login successful': (r) => r.status === 200,
      'login response time OK': (r) => r.timings.duration < 1000,
    });
    
    errorRate.add(loginRes.status !== 200);
    responseTime.add(loginRes.timings.duration);
    apiCalls.add(1);
  });
  
  group('Portfolio Dashboard Load', () => {
    // Test Phase 2 decomposed Portfolio components
    const dashboardRes = http.get(`${BASE_URL}/portfolio`);
    
    check(dashboardRes, {
      'dashboard loads': (r) => r.status === 200,
      'dashboard has content': (r) => r.body.includes('portfolio'),
      'dashboard response time OK': (r) => r.timings.duration < 2000,
    });
    
    errorRate.add(dashboardRes.status !== 200);
    responseTime.add(dashboardRes.timings.duration);
  });
  
  group('API Performance Tests', () => {
    // Test backend API endpoints (164 lines from Phase 2)
    const endpoints = [
      '/api/properties',
      '/api/analytics',
      '/api/reports',
      '/api/settings'
    ];
    
    endpoints.forEach(endpoint => {
      const res = http.get(`${API_URL}${endpoint}`);
      
      check(res, {
        [`${endpoint} responds`]: (r) => r.status === 200 || r.status === 401,
        [`${endpoint} fast response`]: (r) => r.timings.duration < 1500,
      });
      
      errorRate.add(res.status >= 400 && res.status !== 401);
      responseTime.add(res.timings.duration);
      apiCalls.add(1);
    });
  });
  
  group('Revenue System Protection', () => {
    // Test critical $99-$149 report generation (SACRED)
    const reportRes = http.get(`${API_URL}/api/reports/generate`);
    
    check(reportRes, {
      'report endpoint accessible': (r) => r.status === 200 || r.status === 401,
      'report response acceptable': (r) => r.timings.duration < 3000,
    });
    
    errorRate.add(reportRes.status >= 500);
    responseTime.add(reportRes.timings.duration);
  });
  
  group('Phase 2 Component Validation', () => {
    // Test decomposed components under load
    const components = [
      '/api/portfolio/analytics',
      '/api/portfolio/comparison', 
      '/api/portfolio/summary'
    ];
    
    components.forEach(component => {
      const res = http.get(`${API_URL}${component}`);
      
      check(res, {
        [`${component} functional`]: (r) => r.status === 200 || r.status === 401,
        [`${component} performance`]: (r) => r.timings.duration < 2000,
      });
      
      errorRate.add(res.status >= 500);
    });
  });
  
  // Realistic user behavior - brief pause between actions
  sleep(Math.random() * 3 + 1);
}

export function teardown(data) {
  console.log('Load testing completed - Phase 3C');
  console.log('Validating Phase 2 decomposed architecture performance...');
}