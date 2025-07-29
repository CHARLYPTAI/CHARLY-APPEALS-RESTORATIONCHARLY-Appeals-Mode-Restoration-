// LOC_CATEGORY: interface
// Simplified server setup without complex MSW dependencies
import { http, HttpResponse } from 'msw';
import type { LoginCredentials } from '../../../src/types/api';

// Simple in-memory handlers for testing
export const simpleHandlers = [
  // Login endpoint
  http.post('http://localhost:8000/api/auth/login', async ({ request }) => {
    const { username, password } = (await request.json()) as LoginCredentials;

    if (username === 'admin' && password === 'secret') {
      return HttpResponse.json({
        access_token: 'mock-token-123',
        token_type: 'bearer',
        user: { username: 'admin', role: 'admin' },
      });
    }

    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  }),

  // Properties endpoint
  http.get('http://localhost:8000/api/sample-properties', () => {
    return HttpResponse.json([
      {
        account_number: '123456789',
        property_address: '123 Test St, Dallas, TX',
        market_value: 250000,
        assessed_value: 275000,
        flag_status: 'Over-assessed',
      },
    ]);
  }),

  // Upload endpoint
  http.post('http://localhost:8000/api/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    return HttpResponse.json({
      success: true,
      filename: file?.name || 'test.csv',
      records_processed: 100,
      flagged_properties: 25,
    });
  }),

  // Analytics endpoint
  http.get('http://localhost:8000/api/analytics', () => {
    return HttpResponse.json({
      totalProperties: 1000,
      flaggedProperties: 250,
      averageSavings: 15000,
    });
  }),
];

// Mock server setup that bypasses complex node dependencies
export const mockFetch = (url: string, options?: RequestInit) => {
  // For now, return basic mock responses
  if (url.includes('/auth/login')) {
    const body = options?.body;
    let credentials;

    if (body instanceof FormData) {
      credentials = {
        username: body.get('username'),
        password: body.get('password'),
      };
    } else if (typeof body === 'string') {
      try {
        credentials = JSON.parse(body);
      } catch {
        credentials = {};
      }
    }

    if (credentials?.username === 'admin' && credentials?.password === 'secret') {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: 'mock-token-123',
            token_type: 'bearer',
            user: { username: 'admin', role: 'admin' },
          }),
          { status: 200 }
        )
      );
    }

    return Promise.resolve(
      new Response(
        JSON.stringify({
          detail: 'Invalid credentials',
        }),
        { status: 401 }
      )
    );
  }

  if (url.includes('/sample-properties')) {
    return Promise.resolve(
      new Response(
        JSON.stringify([
          {
            account_number: '123456789',
            property_address: '123 Test St, Dallas, TX',
            market_value: 250000,
            assessed_value: 275000,
            flag_status: 'Over-assessed',
          },
        ]),
        { status: 200 }
      )
    );
  }

  if (url.includes('/upload')) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          success: true,
          filename: 'test.csv',
          records_processed: 100,
          flagged_properties: 25,
        }),
        { status: 200 }
      )
    );
  }

  if (url.includes('/analytics')) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          totalProperties: 1000,
          flaggedProperties: 250,
          averageSavings: 15000,
        }),
        { status: 200 }
      )
    );
  }

  return Promise.resolve(new Response('Not found', { status: 404 }));
};
