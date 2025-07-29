// LOC_CATEGORY: interface
import { http, HttpResponse } from 'msw';
import { mockUsers, mockTokens } from '../../setup/mockData';
import type { LoginCredentials } from '../../../src/types/api';

export const authHandlers = [
  // Login endpoint
  http.post('http://localhost:8000/api/auth/login', async ({ request }) => {
    const { username, password } = (await request.json()) as LoginCredentials;

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check credentials
    if (username === 'admin' && password === 'secret') {
      return HttpResponse.json({
        access_token: mockTokens.valid,
        token_type: 'bearer',
        user: mockUsers.admin,
      });
    } else if (username === 'analyst' && password === 'secret') {
      return HttpResponse.json({
        access_token: mockTokens.valid,
        token_type: 'bearer',
        user: mockUsers.analyst,
      });
    } else if (username === 'error' && password === 'error') {
      return HttpResponse.json({ detail: 'Internal server error' }, { status: 500 });
    } else if (username === 'slow' && password === 'slow') {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return HttpResponse.json({
        access_token: mockTokens.valid,
        token_type: 'bearer',
        user: mockUsers.admin,
      });
    }

    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  }),

  // Get current user endpoint
  http.get('http://localhost:8000/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    if (token === mockTokens.expired) {
      return HttpResponse.json({ detail: 'Token expired' }, { status: 401 });
    }

    if (token === mockTokens.invalid) {
      return HttpResponse.json({ detail: 'Invalid token' }, { status: 401 });
    }

    return HttpResponse.json(mockUsers.admin);
  }),
];
