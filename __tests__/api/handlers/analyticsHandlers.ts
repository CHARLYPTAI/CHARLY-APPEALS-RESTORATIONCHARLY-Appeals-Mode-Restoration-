// LOC_CATEGORY: interface
import { http, HttpResponse } from 'msw';
import { mockAnalyticsData, mockNarratives } from '../../setup/mockData';
import type {
  NarrativeGenerationRequest,
  NarrativeUpdateRequest,
  ExportRequest,
} from '../../../src/types/api';

export const analyticsHandlers = [
  // Get analytics data
  http.get('http://localhost:8000/api/analytics', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const jurisdiction = url.searchParams.get('jurisdiction');
    const propertyType = url.searchParams.get('property_type');
    // Date parameters available but not used in mock
    url.searchParams.get('date_from');
    url.searchParams.get('date_to');

    // Simulate error scenario
    if (jurisdiction === 'error') {
      return HttpResponse.json({ detail: 'Analytics service unavailable' }, { status: 500 });
    }

    // Return filtered or full analytics data
    const data = { ...mockAnalyticsData };

    if (jurisdiction && jurisdiction !== 'all') {
      // Filter jurisdiction performance
      data.jurisdictionPerformance = data.jurisdictionPerformance.filter((j) =>
        j.jurisdiction.toLowerCase().includes(jurisdiction.toLowerCase())
      );
    }

    if (propertyType && propertyType !== 'all') {
      // Filter property type analysis
      data.propertyTypeAnalysis = data.propertyTypeAnalysis.filter(
        (p) => p.type.toLowerCase() === propertyType.toLowerCase()
      );
    }

    return HttpResponse.json(data);
  }),

  // Get performance metrics
  http.get('http://localhost:8000/api/analytics/performance', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    return HttpResponse.json({
      response_time: {
        p50: 125,
        p95: 450,
        p99: 890,
      },
      throughput: {
        requests_per_minute: 450,
        successful: 442,
        failed: 8,
      },
      error_rate: 1.78,
      uptime_percentage: 99.95,
      active_users: 127,
      concurrent_sessions: 89,
    });
  }),

  // Get narratives
  http.get('http://localhost:8000/api/narratives', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const type = url.searchParams.get('type');

    let narratives = [...mockNarratives];

    if (search) {
      narratives = narratives.filter(
        (n) =>
          n.property_address.toLowerCase().includes(search.toLowerCase()) ||
          n.account_number.includes(search)
      );
    }

    if (type && type !== 'all') {
      narratives = narratives.filter((n) => n.narrative_type === type);
    }

    return HttpResponse.json(narratives);
  }),

  // Generate narrative
  http.post('http://localhost:8000/api/narratives/generate', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const { property_id, narrative_type } = (await request.json()) as NarrativeGenerationRequest;

    if (!property_id || !narrative_type) {
      return HttpResponse.json({ detail: 'Missing required fields' }, { status: 400 });
    }

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (property_id === 'error') {
      return HttpResponse.json({ detail: 'AI service temporarily unavailable' }, { status: 500 });
    }

    return HttpResponse.json(
      {
        id: Math.random().toString(36).substr(2, 9),
        property_id: property_id,
        narrative_type: narrative_type,
        content: `Generated ${narrative_type} narrative for property ${property_id}. This is a comprehensive analysis based on current market conditions and comparable property data.`,
        status: 'Draft',
        created_date: new Date().toISOString(),
        word_count: 85,
      },
      { status: 201 }
    );
  }),

  // Update narrative
  http.put('http://localhost:8000/api/narratives/:id', async ({ params, request }) => {
    const { id } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const updates = (await request.json()) as NarrativeUpdateRequest;

    if (id === 'notfound') {
      return HttpResponse.json({ detail: 'Narrative not found' }, { status: 404 });
    }

    return HttpResponse.json({
      ...updates,
      id: id,
      updated_at: new Date().toISOString(),
    });
  }),

  // Delete narrative
  http.delete('http://localhost:8000/api/narratives/:id', ({ params, request }) => {
    const { id } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    if (id === 'notfound') {
      return HttpResponse.json({ detail: 'Narrative not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Narrative deleted successfully' });
  }),

  // Export analytics report
  http.post('http://localhost:8000/api/analytics/export', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const { format } = (await request.json()) as ExportRequest;
    // filters parameter available but not used in mock

    if (!['pdf', 'excel', 'csv'].includes(format)) {
      return HttpResponse.json({ detail: 'Invalid export format' }, { status: 400 });
    }

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return HttpResponse.json({
      download_url: `/api/analytics/download/${Math.random().toString(36).substr(2, 9)}`,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      format: format,
      size_bytes: Math.floor(Math.random() * 5000000) + 100000,
    });
  }),
];
