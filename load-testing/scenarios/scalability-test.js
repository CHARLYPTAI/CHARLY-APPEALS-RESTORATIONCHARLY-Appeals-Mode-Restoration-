// Scalability Testing for CHARLY Platform
// Phase 3C: 10x, 50x, 100x Load Validation

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Advanced metrics for scalability analysis
const errorRate = new Rate('scalability_errors');
const responseTime = new Trend('scalability_response_time');
const throughput = new Counter('requests_per_second');
const concurrentUsers = new Gauge('concurrent_users');

export const options = {
  scenarios: {
    // 10x Normal Load Test
    load_10x: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 }, // 10x baseline (10 users)
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      tags: { scale: '10x' },
    },
    
    // 50x Load Test
    load_50x: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '3m', target: 500 }, // 50x baseline
        { duration: '10m', target: 500 },
        { duration: '3m', target: 0 },
      ],
      tags: { scale: '50x' },
    },
    
    // 100x Load Test - Breaking Point Analysis
    load_100x: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 1000 }, // 100x baseline
        { duration: '15m', target: 1000 },
        { duration: '5m', target: 0 },
      ],
      tags: { scale: '100x' },
    }
  },
  
  thresholds: {
    // Progressive performance degradation thresholds
    'scalability_response_time': [
      'p(50)<1000',    // 50% under 1s
      'p(95)<5000',    // 95% under 5s
      'p(99)<10000',   // 99% under 10s
    ],
    'scalability_errors': ['rate<0.1'], // 10% error tolerance under extreme load
    'http_req_duration': ['p(95)<5000'], // Relaxed for high load
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:8000';

// Simulate different user types and behaviors
const userProfiles = [
  { type: 'light', requests: 3, delay: [2, 5] },
  { type: 'medium', requests: 7, delay: [1, 3] },
  { type: 'heavy', requests: 15, delay: [0.5, 2] },
];

export function setup() {
  console.log('Starting CHARLY Platform Scalability Testing');
  console.log('Testing Phase 2 decomposed architecture under extreme load');
  
  // Baseline health check
  const healthCheck = http.get(`${API_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('System not healthy before scalability test');
  }
}

export default function() {
  const startTime = Date.now();
  concurrentUsers.add(1);
  
  // Select random user profile
  const profile = userProfiles[Math.floor(Math.random() * userProfiles.length)];
  
  group(`Scalability Test - ${profile.type} user`, () => {
    
    // Test Phase 2 decomposed components under load
    group('Portfolio Components Load', () => {
      const components = [
        '/api/portfolio/summary',
        '/api/portfolio/analytics', 
        '/api/portfolio/comparison'
      ];
      
      components.forEach(component => {
        const res = http.get(`${API_URL}${component}`);
        
        check(res, {
          [`${component} responds under load`]: (r) => r.status < 500,
          [`${component} reasonable time`]: (r) => r.timings.duration < 10000,
        });
        
        errorRate.add(res.status >= 500);
        responseTime.add(res.timings.duration);
        throughput.add(1);
      });
    });
    
    group('Backend API Stress', () => {
      // Test the 164-line decomposed backend under stress
      const endpoints = [
        '/api/properties',
        '/api/reports',
        '/api/analytics',
        '/api/settings'
      ];
      
      for (let i = 0; i < profile.requests; i++) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        const res = http.get(`${API_URL}${endpoint}`);
        
        check(res, {
          'api responds under stress': (r) => r.status < 500,
          'api not timing out': (r) => r.timings.duration < 30000,
        });
        
        errorRate.add(res.status >= 500);
        responseTime.add(res.timings.duration);
        throughput.add(1);
        
        // Variable delay based on user profile
        const [min, max] = profile.delay;
        sleep(Math.random() * (max - min) + min);
      }
    });
    
    group('Revenue System Under Load', () => {
      // Critical test: $99-$149 report system under stress
      const reportRes = http.get(`${API_URL}/api/reports/status`);
      
      check(reportRes, {
        'revenue system accessible': (r) => r.status < 500,
        'revenue system responsive': (r) => r.timings.duration < 15000,
      });
      
      errorRate.add(reportRes.status >= 500);
      responseTime.add(reportRes.timings.duration);
    });
    
    group('Database Performance', () => {
      // Test database performance under load
      const dbRes = http.get(`${API_URL}/api/properties?limit=100`);
      
      check(dbRes, {
        'database responds': (r) => r.status < 500,
        'database query time OK': (r) => r.timings.duration < 20000,
      });
      
      errorRate.add(dbRes.status >= 500);
      responseTime.add(dbRes.timings.duration);
    });
  });
  
  // Record session metrics
  const sessionTime = Date.now() - startTime;
  responseTime.add(sessionTime);
  
  // Random user behavior
  sleep(Math.random() * 2);
}

export function teardown(data) {
  console.log('Scalability testing completed');
  console.log('Analyzing Phase 2 architecture performance under extreme load...');
  
  // Log key metrics
  const summary = data.metrics;
  console.log(`Average response time: ${summary.scalability_response_time?.values?.avg || 'N/A'}ms`);
  console.log(`Error rate: ${(summary.scalability_errors?.values?.rate || 0) * 100}%`);
  console.log(`Total requests: ${summary.requests_per_second?.values?.count || 0}`);
}