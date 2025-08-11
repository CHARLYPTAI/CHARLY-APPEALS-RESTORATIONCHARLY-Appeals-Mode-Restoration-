import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Portfolio } from '../src/pages/Portfolio';
import * as fileValidation from '../src/lib/fileValidation';

// Mock file validation
vi.mock('../src/lib/fileValidation', () => ({
  validateFileList: vi.fn(),
  formatValidationErrors: vi.fn(),
}));

// Mock toast hook
const mockToast = vi.fn();
vi.mock('../src/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ state: null }),
}));

// Mock stores
vi.mock('../src/store/portfolio', () => ({
  usePortfolioStore: () => ({
    properties: [],
    uploadFiles: vi.fn(),
    loading: false,
    error: null,
  }),
}));

vi.mock('../src/store/propertyAnalysis', () => ({
  usePropertyAnalysisStore: () => ({
    analysisResults: new Map(),
    runBatchAnalysis: vi.fn(),
  }),
}));

// Mock market data service
vi.mock('../src/services/marketDataService', () => ({
  MarketDataService: {
    generateSupernova2BReport: vi.fn(),
  },
}));

describe('Portfolio Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('handles file upload with validation', async () => {
    const mockValidateFileList = vi.mocked(fileValidation.validateFileList);
    mockValidateFileList.mockReturnValue({
      valid: true,
      results: [{ valid: true }],
      errors: []
    });

    render(<Portfolio />);
    
    const fileInput = screen.getByLabelText('Upload CSV, Excel, or XML files');
    const validFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    await waitFor(() => {
      expect(mockValidateFileList).toHaveBeenCalledWith([validFile]);
    });
  });

  test('displays validation errors for invalid files', async () => {
    const mockValidateFileList = vi.mocked(fileValidation.validateFileList);
    const mockFormatValidationErrors = vi.mocked(fileValidation.formatValidationErrors);
    
    mockValidateFileList.mockReturnValue({
      valid: false,
      results: [{ valid: false, error: 'File too large' }],
      errors: ['File too large']
    });
    
    mockFormatValidationErrors.mockReturnValue('File too large');

    render(<Portfolio />);
    
    const fileInput = screen.getByLabelText('Upload CSV, Excel, or XML files');
    const invalidFile = new File(['x'.repeat(1000000)], 'large.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'File validation failed',
        description: 'File too large',
        variant: 'destructive',
      });
    });
  });

  test('prevents upload of malicious file types', async () => {
    const mockValidateFileList = vi.mocked(fileValidation.validateFileList);
    
    mockValidateFileList.mockReturnValue({
      valid: false,
      results: [{ valid: false, error: 'Invalid file type' }],
      errors: ['Invalid file type']
    });

    render(<Portfolio />);
    
    const fileInput = screen.getByLabelText('Upload CSV, Excel, or XML files');
    const maliciousFile = new File(['malicious content'], 'virus.exe', { type: 'application/octet-stream' });
    
    fireEvent.change(fileInput, { target: { files: [maliciousFile] } });
    
    await waitFor(() => {
      expect(mockValidateFileList).toHaveBeenCalledWith([maliciousFile]);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'File validation failed',
          variant: 'destructive',
        })
      );
    });
  });

  test('handles multiple file upload', async () => {
    const mockValidateFileList = vi.mocked(fileValidation.validateFileList);
    mockValidateFileList.mockReturnValue({
      valid: true,
      results: [{ valid: true }, { valid: true }],
      errors: []
    });

    render(<Portfolio />);
    
    const fileInput = screen.getByLabelText('Upload CSV, Excel, or XML files');
    const file1 = new File(['data1'], 'file1.csv', { type: 'text/csv' });
    const file2 = new File(['data2'], 'file2.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    fireEvent.change(fileInput, { target: { files: [file1, file2] } });
    
    await waitFor(() => {
      expect(mockValidateFileList).toHaveBeenCalledWith([file1, file2]);
    });
  });

  test('displays upload progress when processing files', async () => {
    const mockValidateFileList = vi.mocked(fileValidation.validateFileList);
    mockValidateFileList.mockReturnValue({
      valid: true,
      results: [{ valid: true }],
      errors: []
    });

    render(<Portfolio />);
    
    const fileInput = screen.getByLabelText('Upload CSV, Excel, or XML files');
    const validFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    // Should show upload progress UI
    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });

  test('handles empty file list gracefully', async () => {
    const mockValidateFileList = vi.mocked(fileValidation.validateFileList);
    mockValidateFileList.mockReturnValue({
      valid: false,
      results: [],
      errors: []
    });

    render(<Portfolio />);
    
    const fileInput = screen.getByLabelText('Upload CSV, Excel, or XML files');
    
    fireEvent.change(fileInput, { target: { files: [] } });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'No files selected',
        description: 'Please select valid files to upload.',
        variant: 'destructive',
      });
    });
  });

  test('validates file size limits', async () => {
    const mockValidateFileList = vi.mocked(fileValidation.validateFileList);
    mockValidateFileList.mockReturnValue({
      valid: false,
      results: [{ valid: false, error: 'File size must be under 10MB' }],
      errors: ['File size must be under 10MB']
    });

    render(<Portfolio />);
    
    const fileInput = screen.getByLabelText('Upload CSV, Excel, or XML files');
    // Create a file that would be too large
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(mockValidateFileList).toHaveBeenCalledWith([largeFile]);
    });
  });

  test('renders portfolio property list when data is available', () => {
    render(<Portfolio />);
    
    // Should render the main portfolio interface
    expect(screen.getByText(/property portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/upload/i)).toBeInTheDocument();
  });

  test('shows loading state during file processing', async () => {
    vi.mock('../src/store/portfolio', () => ({
      usePortfolioStore: () => ({
        properties: [],
        uploadFiles: vi.fn(),
        loading: true,
        error: null,
      }),
    }));

    render(<Portfolio />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});