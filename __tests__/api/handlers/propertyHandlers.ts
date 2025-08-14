// LOC_CATEGORY: interface
import { http, HttpResponse } from 'msw';
import {
  mockProperties,
  mockJurisdictions,
  mockCanonicalFields,
  generateMockProperties,
} from '../../setup/mockData';
import type { PropertyFormData } from '../../../src/types/api';

export const propertyHandlers = [
  // Get sample properties
  http.get('http://localhost:8000/api/sample-properties', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    // Simulate different scenarios based on query params
    const url = new URL(request.url);
    const error = url.searchParams.get('error');
    const empty = url.searchParams.get('empty');
    const large = url.searchParams.get('large');

    if (error === 'true') {
      return HttpResponse.json({ detail: 'Database connection error' }, { status: 500 });
    }

    if (empty === 'true') {
      return HttpResponse.json([]);
    }

    if (large === 'true') {
      return HttpResponse.json(generateMockProperties(100));
    }

    return HttpResponse.json(mockProperties);
  }),

  // Get jurisdictions
  http.get('http://localhost:8000/api/jurisdictions', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    return HttpResponse.json(mockJurisdictions);
  }),

  // Get canonical fields
  http.get('http://localhost:8000/api/canonical-fields', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    return HttpResponse.json(mockCanonicalFields);
  }),

  // Get property by ID
  http.get('http://localhost:8000/api/properties/:id', ({ params, request }) => {
    const { id } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const property = mockProperties.find((p) => p.account_number === id);

    if (!property) {
      return HttpResponse.json({ detail: 'Property not found' }, { status: 404 });
    }

    return HttpResponse.json(property);
  }),

  // Create property
  http.post('http://localhost:8000/api/properties', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const propertyData = (await request.json()) as PropertyFormData;

    // Validate required fields
    if (!propertyData.account_number || !propertyData.property_address) {
      return HttpResponse.json({ detail: 'Missing required fields' }, { status: 400 });
    }

    // Simulate duplicate check
    if (propertyData.account_number === '999999999') {
      return HttpResponse.json(
        { detail: 'Property with this account number already exists' },
        { status: 409 }
      );
    }

    return HttpResponse.json(
      {
        ...propertyData,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // Update property
  http.put('http://localhost:8000/api/properties/:id', async ({ params, request }) => {
    const { id } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const propertyData = (await request.json()) as PropertyFormData;

    if (id === '404404404') {
      return HttpResponse.json({ detail: 'Property not found' }, { status: 404 });
    }

    return HttpResponse.json({
      ...propertyData,
      account_number: id,
      updated_at: new Date().toISOString(),
    });
  }),

  // Delete property
  http.delete('http://localhost:8000/api/properties/:id', ({ params, request }) => {
    const { id } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    if (id === '404404404') {
      return HttpResponse.json({ detail: 'Property not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Property deleted successfully' });
  }),

  // Flag properties endpoint
  http.post('http://localhost:8000/api/properties/flag', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const { property_ids } = (await request.json()) as { property_ids: string[] };

    if (!property_ids || !Array.isArray(property_ids)) {
      return HttpResponse.json({ detail: 'Invalid request format' }, { status: 400 });
    }

    return HttpResponse.json({
      flagged: property_ids.length,
      results: property_ids.map((id) => ({
        account_number: id,
        flag_status: 'Over-assessed',
        appeal_potential: 'High',
        reasons: ['Market value analysis', 'Comparable sales data'],
      })),
    });
  }),
];
