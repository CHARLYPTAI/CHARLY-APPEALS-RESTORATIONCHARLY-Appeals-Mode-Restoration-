// Critical User Journeys for CHARLY Platform Load Testing
// Phase 3C: Realistic User Scenario Testing

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('journey_errors');
const journeyTime = new Trend('journey_duration');

export const options = {
  scenarios: {
    // Critical Journey 1: Property Tax Professional Workflow
    property_professional: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10m',
      tags: { journey: 'property_professional' },
    },
    
    // Critical Journey 2: Bulk Report Generation
    bulk_reports: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 0 },
      ],
      tags: { journey: 'bulk_reports' },
    }
  },
  
  thresholds: {
    'journey_duration': ['p(95)<10000'], // Complete journeys under 10s
    'journey_errors': ['rate<0.05'],     // Journey failure rate < 5%
    'http_req_duration': ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:8000';

export default function() {
  const journeyStart = Date.now();
  
  group('Complete Property Analysis Journey', () => {
    // Step 1: User Login
    group('Authentication', () => {
      const loginRes = http.post(`${API_URL}/auth/login`, {
        username: 'testuser',
        password: 'password123'
      });
      
      check(loginRes, {
        'login successful': (r) => r.status === 200,
      });
      
      if (loginRes.status !== 200) {
        errorRate.add(1);
        return;
      }
      
      sleep(1);
    });
    
    // Step 2: Navigate to Portfolio (Phase 2 decomposed component)
    group('Portfolio Access', () => {
      const portfolioRes = http.get(`${BASE_URL}/portfolio`);
      
      check(portfolioRes, {
        'portfolio loads': (r) => r.status === 200,
        'has portfolio content': (r) => r.body.includes('PropertyList') || r.body.includes('portfolio'),
      });
      
      sleep(2);
    });
    
    // Step 3: Upload Property Data
    group('Data Upload', () => {
      const uploadRes = http.post(`${API_URL}/api/upload`, {
        file: 'sample_data.csv', // Simulated file upload
        type: 'csv'
      });
      
      check(uploadRes, {
        'upload accepted': (r) => r.status === 200 || r.status === 202,
      });
      
      sleep(3); // Processing time
    });
    
    // Step 4: Generate Analysis Report
    group('Report Generation', () => {
      const reportRes = http.post(`${API_URL}/api/reports/generate`, {
        properties: ['1001', '1002', '1003'],
        type: 'appeal_packet'
      });
      
      check(reportRes, {
        'report generated': (r) => r.status === 200,
        'report has content': (r) => r.json('status') === 'success',
      });
      
      sleep(5); // Report generation time
    });
    
    // Step 5: Download Results (Revenue Critical - $99-$149)
    group('Revenue System', () => {
      const downloadRes = http.get(`${API_URL}/api/reports/download/123`);
      
      check(downloadRes, {
        'download available': (r) => r.status === 200,
        'has pdf content': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('pdf'),
      });
    });
  });
  
  // Record complete journey time
  const journeyDuration = Date.now() - journeyStart;
  journeyTime.add(journeyDuration);
  
  // Realistic user pause
  sleep(Math.random() * 5 + 2);
}

export function handleSummary(data) {
  return {
    'journey-results.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}