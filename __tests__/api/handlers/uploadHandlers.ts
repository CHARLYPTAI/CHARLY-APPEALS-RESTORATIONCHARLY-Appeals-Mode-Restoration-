// LOC_CATEGORY: interface
import { http, HttpResponse } from 'msw';
// import { mockUploadResults } from '../../setup/mockData';

export const uploadHandlers = [
  // File upload endpoint
  http.post('http://localhost:8000/api/upload', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    // Simulate file processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return HttpResponse.json({ detail: 'No file provided' }, { status: 400 });
    }

    // Simulate different scenarios based on filename
    if (file.name.includes('error')) {
      return HttpResponse.json({ detail: 'File processing failed' }, { status: 500 });
    }

    if (file.name.includes('corrupt')) {
      return HttpResponse.json({ detail: 'File is corrupted or invalid format' }, { status: 422 });
    }

    if (file.name.includes('large')) {
      // Simulate timeout for large files
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return HttpResponse.json({ detail: 'File processing timeout' }, { status: 504 });
    }

    // Determine file type
    let fileType = 'unknown';
    if (file.name.endsWith('.csv')) fileType = 'csv';
    else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) fileType = 'spreadsheet';
    else if (file.name.endsWith('.json')) fileType = 'json';
    else if (file.name.endsWith('.xml')) fileType = 'xml';
    else if (file.name.endsWith('.txt')) fileType = 'text';

    return HttpResponse.json({
      success: true,
      records_processed: Math.floor(Math.random() * 200) + 50,
      flagged_properties: Math.floor(Math.random() * 50) + 10,
      file_type: fileType,
      message: `File ${file.name} processed successfully`,
      upload_id: Math.random().toString(36).substr(2, 9),
      processing_time: Math.random() * 3 + 1,
    });
  }),

  // Bulk upload endpoint
  http.post('http://localhost:8000/api/bulk-upload', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const { source } = (await request.json()) as {
      file_type: string;
      source: string;
      options?: Record<string, unknown>;
    };
    // file_type and options available but not used in mock

    if (source === 'error') {
      return HttpResponse.json({ detail: 'Bulk upload service unavailable' }, { status: 500 });
    }

    if (source === 'google_drive' || source === 'dropbox' || source === 'aws_s3') {
      return HttpResponse.json({
        success: true,
        upload_id: 'cloud_' + Math.random().toString(36).substr(2, 9),
        status: 'authenticating',
        auth_url: `https://auth.${source}.com/oauth`,
        message: `Cloud upload initiated for ${source}`,
      });
    }

    return HttpResponse.json({
      success: true,
      upload_id: 'bulk_' + Math.random().toString(36).substr(2, 9),
      status: 'processing',
      message: 'Local bulk upload initiated',
      estimated_time: 120,
    });
  }),

  // Upload status endpoint
  http.get('http://localhost:8000/api/upload/:uploadId/status', ({ params, request }) => {
    const { uploadId } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    // Simulate different upload states
    const progress = Math.random() * 100;
    let status = 'processing';

    if (progress > 90) status = 'completed';
    else if (progress > 10 && uploadId.includes('error')) status = 'failed';

    return HttpResponse.json({
      upload_id: uploadId,
      status: status,
      progress: Math.floor(progress),
      records_processed: Math.floor(progress * 2),
      errors: status === 'failed' ? ['Invalid data format on line 42'] : [],
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    });
  }),

  // Cancel upload endpoint
  http.post('http://localhost:8000/api/upload/:uploadId/cancel', ({ params, request }) => {
    const { uploadId } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    if (uploadId === 'completed_123') {
      return HttpResponse.json({ detail: 'Cannot cancel completed upload' }, { status: 400 });
    }

    return HttpResponse.json({
      message: 'Upload cancelled successfully',
      upload_id: uploadId,
    });
  }),

  // Download results endpoint
  http.get('http://localhost:8000/api/upload/:uploadId/download', ({ params, request }) => {
    const { uploadId } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    if (uploadId === 'notfound_123') {
      return HttpResponse.json({ detail: 'Upload results not found' }, { status: 404 });
    }

    // Return a mock CSV file
    const csvContent = `account_number,property_address,flag_status,appeal_potential
123456789,"123 Main St, Dallas, TX",Over-assessed,High
987654321,"456 Oak Ave, Dallas, TX",Fair,Low`;

    return new HttpResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="results_${uploadId}.csv"`,
      },
    });
  }),
];
