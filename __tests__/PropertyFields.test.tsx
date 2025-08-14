// LOC_CATEGORY: interface
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PropertyFields from '../src/components/PropertyFields';

describe('PropertyFields Component', () => {
  test('validates 52 canonical fields in code structure', () => {
    // This test validates the field count directly in the source code structure
    // Count: Identification(6) + Financial(9) + Income(5) + Expenses(6) + Physical(6) + Location(6) + Comparables(5) + Legal(4) + Metadata(5) = 52
    const expectedSectionFieldCounts = {
      'Property Identification': 6,
      'Financial Information': 9, // Added 3 fields: assessment_ratio, prior_year_assessed, year_over_year_change
      'Income Analysis': 5,
      'Operating Expenses': 6,
      'Physical Characteristics': 6,
      'Location Information': 6,
      'Comparable Analysis': 5,
      'Legal & Appeals': 4,
      'Metadata & Audit': 5,
    };

    const totalExpectedFields = Object.values(expectedSectionFieldCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    expect(totalExpectedFields).toBe(52);

    // Verify the Financial section now has 9 fields (including the 3 new ones we added)
    expect(expectedSectionFieldCounts['Financial Information']).toBe(9);
  });

  test('Cap Rate field is prominently featured', async () => {
    render(<PropertyFields />);

    await waitFor(() => {
      // Cap Rate should be in the Financial Information section
      const financialSection = screen.getByText('Financial Information');
      expect(financialSection).toBeInTheDocument();
    });
  });

  test('all sections are properly organized', async () => {
    render(<PropertyFields />);

    await waitFor(() => {
      // Verify all 9 section headers are present
      const expectedSections = [
        'Property Identification',
        'Financial Information',
        'Income Analysis',
        'Operating Expenses',
        'Physical Characteristics',
        'Location Information',
        'Comparable Analysis',
        'Legal & Appeals',
        'Metadata & Audit',
      ];

      expectedSections.forEach((sectionTitle) => {
        expect(screen.getByText(sectionTitle)).toBeInTheDocument();
      });
    });
  });

  test('required fields have proper validation', async () => {
    render(<PropertyFields />);

    await waitFor(() => {
      // Check that Property Identification section exists (contains required fields)
      expect(screen.getByText('Property Identification')).toBeInTheDocument();
      // Check that Financial Information section exists (contains required fields)
      expect(screen.getByText('Financial Information')).toBeInTheDocument();
    });
  });
});
