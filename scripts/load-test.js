/**
 * Sprint 4 Load/Performance Testing Script (UC-142)
 * Uses k6 for load testing - run with: k6 run scripts/load-test.js
 * 
 * Install k6: https://k6.io/docs/getting-started/installation/
 * 
 * Test scenarios:
 * - Smoke test: 1 VU, 1 minute
 * - Load test: 50 VUs, 5 minutes  
 * - Stress test: 100 VUs, 10 minutes
 * - Spike test: 0 -> 200 VUs -> 0
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

// Test configuration
export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      startTime: '1m',
      tags: { test_type: 'load' },
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '10m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      startTime: '10m',
      tags: { test_type: 'stress' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.05'],
    api_latency: ['p(95)<400'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function() {
  group('Landing Page', () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, {
      'landing status is 200': (r) => r.status === 200,
      'landing loads in < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(res.status !== 200);
    apiLatency.add(res.timings.duration);
    sleep(1);
  });

  group('Login Page', () => {
    const res = http.get(`${BASE_URL}/login`);
    check(res, {
      'login page status is 200': (r) => r.status === 200,
      'login page loads in < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(res.status !== 200);
    sleep(1);
  });

  group('Static Assets', () => {
    const res = http.get(`${BASE_URL}/favicon.png`);
    check(res, {
      'favicon loads': (r) => r.status === 200,
    });
    sleep(0.5);
  });

  group('API Health Check', () => {
    // Check Supabase edge function availability
    const supabaseUrl = __ENV.SUPABASE_URL;
    if (supabaseUrl) {
      const res = http.get(`${supabaseUrl}/functions/v1/health`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      check(res, {
        'health check responds': (r) => r.status < 500,
      });
    }
    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    'test-results/load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { metrics, root_group } = data;
  let summary = '\n\n=== LOAD TEST SUMMARY ===\n\n';
  
  summary += `Total Requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `Failed Requests: ${metrics.http_req_failed?.values?.passes || 0}\n`;
  summary += `Avg Response Time: ${(metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms\n`;
  summary += `P95 Response Time: ${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `P99 Response Time: ${(metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms\n`;
  summary += `Error Rate: ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  
  summary += '\n=== THRESHOLDS ===\n';
  if (data.thresholds) {
    Object.entries(data.thresholds).forEach(([name, result]) => {
      summary += `${result.ok ? '✓' : '✗'} ${name}: ${result.ok ? 'PASS' : 'FAIL'}\n`;
    });
  }
  
  return summary;
}
