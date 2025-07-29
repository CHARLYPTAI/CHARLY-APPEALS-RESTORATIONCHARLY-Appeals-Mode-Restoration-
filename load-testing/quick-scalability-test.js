// Quick Scalability Test - 10x Load Validation
// Phase 3C: Rapid scalability validation for Phase 2 architecture

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('scalability_errors');
const responseTime = new Trend('scalability_response_time');
const throughput = new Counter('requests_per_second');

export const options = {
  scenarios: {
    // Quick 10x load test
    load_10x: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },  // 20x baseline load (fast ramp)
        { duration: '1m', target: 20 },   // Sustained 20x load
        { duration: '30s', target: 0 },   // Quick ramp down
      ],
      tags: { scale: '20x_quick' },
    }
  },
  
  thresholds: {
    'scalability_response_time': ['p(95)<2000'],  // Apple CTO standard
    'scalability_errors': ['rate<0.05'],          // 5% error tolerance
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:8000';

export function setup() {
  console.log('🚀 Quick 20x Scalability Test - Phase 2 Architecture');
  console.log('Validating 164-line backend under 20x normal load');
  
  const health = http.get(`${API_URL}/health`);
  if (health.status !== 200) {
    throw new Error('Backend not ready for scalability test');
  }
}

export default function() {
  
  group('High Load Backend Test', () => {
    // Test core endpoints under high load
    const endpoints = ['/health', '/api/properties', '/api/reports/status'];
    
    endpoints.forEach(endpoint => {
      const res = http.get(`${API_URL}${endpoint}`);
      
      check(res, {
        [`${endpoint} responds under load`]: (r) => r.status === 200,
        [`${endpoint} acceptable timing`]: (r) => r.timings.duration < 5000,
      });
      
      errorRate.add(res.status !== 200);
      responseTime.add(res.timings.duration);
      throughput.add(1);
    });
  });
  
  group('Revenue System Under Load', () => {
    // Critical test: Revenue system under 20x load
    const res = http.get(`${API_URL}/api/reports/status`);
    
    check(res, {
      'revenue system stable under load': (r) => r.status === 200,
      'revenue protection verified': (r) => r.json('revenue_system') === 'SACRED_PROTECTED',
    });
    
    errorRate.add(res.status !== 200);
    responseTime.add(res.timings.duration);
  });
  
  sleep(0.2); // Fast iteration for high load
}

export function teardown(data) {
  const metrics = data.metrics;
  
  console.log('\n=== 20X SCALABILITY TEST RESULTS ===');
  console.log(`Average Response Time: ${metrics.scalability_response_time?.values?.avg || 'N/A'}ms`);
  console.log(`P95 Response Time: ${metrics.scalability_response_time?.values?.['p(95)'] || 'N/A'}ms`);
  console.log(`Error Rate: ${(metrics.scalability_errors?.values?.rate || 0) * 100}%`);
  console.log(`Total Requests: ${metrics.requests_per_second?.values?.count || 0}`);
  
  // Validation
  const p95 = metrics.scalability_response_time?.values?.['p(95)'] || Infinity;
  const errors = metrics.scalability_errors?.values?.rate || 1;
  
  console.log('\n=== APPLE CTO SCALABILITY VALIDATION ===');
  console.log(`P95 < 2000ms: ${p95 < 2000 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Error Rate < 5%: ${errors < 0.05 ? '✅ PASS' : '❌ FAIL'}`);
  
  if (p95 < 2000 && errors < 0.05) {
    console.log('\n🏆 PHASE 2 ARCHITECTURE SCALES SUCCESSFULLY TO 20X LOAD');
  }
}