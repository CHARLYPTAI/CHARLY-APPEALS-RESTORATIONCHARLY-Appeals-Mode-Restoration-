import React, { useState, useCallback } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { Property } from '../../types/property';
import { Button } from './Button';
import { Card } from './Card';
import { ProgressiveDisclosure } from './ProgressiveDisclosure';

// Register fonts for professional appearance
Font.register({
  family: 'SF Pro Display',
  fonts: [
    { src: '/fonts/SF-Pro-Display-Regular.otf', fontWeight: 400 },
    { src: '/fonts/SF-Pro-Display-Medium.otf', fontWeight: 500 },
    { src: '/fonts/SF-Pro-Display-Bold.otf', fontWeight: 700 },
  ]
});

// Professional PDF styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'SF Pro Display',
    fontSize: 11,
    lineHeight: 1.6,
    paddingTop: 72,
    paddingBottom: 72,
    paddingHorizontal: 72,
    color: '#1d1d1f',
  },
  header: {
    marginBottom: 36,
    borderBottom: '2pt solid #0071e3',
    paddingBottom: 24,
  },
  logo: {
    width: 120,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
    color: '#0071e3',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 500,
    color: '#6e6e73',
    marginBottom: 4,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
    color: '#0071e3',
    borderBottom: '1pt solid #d2d2d7',
    paddingBottom: 8,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    marginTop: 16,
    color: '#1d1d1f',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4,
  },
  label: {
    width: '35%',
    fontWeight: 500,
    color: '#6e6e73',
  },
  value: {
    width: '65%',
    color: '#1d1d1f',
  },
  highlight: {
    backgroundColor: '#fff3cd',
    padding: 4,
    borderRadius: 4,
  },
  table: {
    marginTop: 12,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f7',
    padding: 8,
    fontWeight: 600,
    borderBottom: '1pt solid #d2d2d7',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '0.5pt solid #e8e8ed',
  },
  tableCell: {
    flex: 1,
  },
  narrative: {
    marginTop: 16,
    marginBottom: 16,
    lineHeight: 1.8,
    textAlign: 'justify',
  },
  signature: {
    marginTop: 48,
    borderTop: '1pt solid #d2d2d7',
    paddingTop: 24,
  },
  signatureLine: {
    marginTop: 36,
    borderBottom: '1pt solid #1d1d1f',
    width: 200,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 72,
    right: 72,
    textAlign: 'center',
    fontSize: 9,
    color: '#6e6e73',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 36,
    right: 72,
    fontSize: 9,
    color: '#6e6e73',
  },
});

interface PacketData {
  property: Property;
  narrative: string;
  comparables?: Property[];
  exhibits?: Array<{
    title: string;
    description: string;
    type: 'image' | 'document' | 'spreadsheet';
    url?: string;
  }>;
  analysisDate: Date;
  analyst?: {
    name: string;
    title: string;
    license?: string;
  };
}

const TaxAppealDocument: React.FC<{ data: PacketData }> = ({ data }) => {
  const { property, narrative, comparables, analysisDate, analyst } = data;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Property Tax Appeal Packet</Text>
          <Text style={styles.subtitle}>{property.address}</Text>
          <Text style={{ fontSize: 12, marginTop: 8 }}>
            Case #: {property.caseNumber || 'TBD'} | Date: {analysisDate.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.narrative}>
            <Text>{narrative}</Text>
          </View>
          
          <View style={[styles.row, styles.highlight]}>
            <Text style={styles.label}>Current Assessment:</Text>
            <Text style={[styles.value, { fontWeight: 600 }]}>
              ${property.assessedValue?.toLocaleString() || 'N/A'}
            </Text>
          </View>
          <View style={[styles.row, styles.highlight]}>
            <Text style={styles.label}>Recommended Value:</Text>
            <Text style={[styles.value, { fontWeight: 600, color: '#0071e3' }]}>
              ${property.marketValue?.toLocaleString() || 'N/A'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Potential Tax Savings:</Text>
            <Text style={[styles.value, { fontWeight: 600, color: '#34c759' }]}>
              ${((property.assessedValue || 0) - (property.marketValue || 0)) * 0.02}
            </Text>
          </View>
        </View>
        
        <Text style={styles.pageNumber}>Page 1</Text>
      </Page>

      {/* Property Details Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Information</Text>
          
          <Text style={styles.subsectionTitle}>Identification</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Property ID:</Text>
            <Text style={styles.value}>{property.propertyId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{property.address}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Owner:</Text>
            <Text style={styles.value}>{property.ownerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tax Year:</Text>
            <Text style={styles.value}>{property.taxYear}</Text>
          </View>

          <Text style={styles.subsectionTitle}>Physical Characteristics</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Property Type:</Text>
            <Text style={styles.value}>{property.propertyType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Year Built:</Text>
            <Text style={styles.value}>{property.yearBuilt}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Building Size:</Text>
            <Text style={styles.value}>{property.buildingSize?.toLocaleString()} sq ft</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Land Size:</Text>
            <Text style={styles.value}>{property.landSize?.toLocaleString()} sq ft</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Analysis</Text>
          
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Metric</Text>
              <Text style={styles.tableCell}>Value</Text>
              <Text style={styles.tableCell}>Market Avg</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Net Operating Income</Text>
              <Text style={styles.tableCell}>${property.noi?.toLocaleString()}</Text>
              <Text style={styles.tableCell}>-</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Cap Rate</Text>
              <Text style={styles.tableCell}>{(property.capRate * 100).toFixed(2)}%</Text>
              <Text style={styles.tableCell}>7.5%</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Expense Ratio</Text>
              <Text style={styles.tableCell}>{(property.expenseRatio * 100).toFixed(2)}%</Text>
              <Text style={styles.tableCell}>35%</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.pageNumber}>Page 2</Text>
      </Page>

      {/* Comparable Analysis Page */}
      {comparables && comparables.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comparable Property Analysis</Text>
            
            {comparables.map((comp, index) => (
              <View key={index} style={{ marginBottom: 24 }}>
                <Text style={styles.subsectionTitle}>Comparable #{index + 1}</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Address:</Text>
                  <Text style={styles.value}>{comp.address}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Sale Date:</Text>
                  <Text style={styles.value}>{comp.saleDate}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Sale Price:</Text>
                  <Text style={styles.value}>${comp.salePrice?.toLocaleString()}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Price/SF:</Text>
                  <Text style={styles.value}>
                    ${(comp.salePrice / comp.buildingSize).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          <Text style={styles.pageNumber}>Page 3</Text>
        </Page>
      )}

      {/* Signature Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certification & Authorization</Text>
          
          <View style={styles.narrative}>
            <Text>
              I hereby certify that the information contained in this property tax appeal packet 
              is true and accurate to the best of my knowledge. The analysis has been prepared in 
              accordance with applicable professional standards and regulations.
            </Text>
          </View>

          <View style={styles.signature}>
            {analyst && (
              <>
                <View style={styles.signatureLine} />
                <Text>{analyst.name}</Text>
                <Text style={{ fontSize: 10, color: '#6e6e73' }}>{analyst.title}</Text>
                {analyst.license && (
                  <Text style={{ fontSize: 10, color: '#6e6e73' }}>
                    License: {analyst.license}
                  </Text>
                )}
              </>
            )}
            
            <View style={[styles.signatureLine, { marginTop: 48 }]} />
            <Text>Property Owner Signature</Text>
            <Text style={{ fontSize: 10, color: '#6e6e73' }}>Date: _______________</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Generated by CHARLY 2.0 Professional Tax Appeal System</Text>
          <Text>© 2024 All Rights Reserved | Confidential & Proprietary</Text>
        </View>
      </Page>
    </Document>
  );
};

export const PacketGenerator: React.FC<{ property: Property }> = ({ property }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrative, setNarrative] = useState('');
  const [includeComparables, setIncludeComparables] = useState(true);
  const [includeExhibits, setIncludeExhibits] = useState(true);

  const generateNarrative = useCallback(async () => {
    setIsGenerating(true);
    try {
      // In production, this would call the GPT API
      const mockNarrative = `Based on our comprehensive analysis of the property located at ${property.address}, 
      we have determined that the current tax assessment of $${property.assessedValue?.toLocaleString()} 
      significantly exceeds the property's fair market value. Our analysis, which includes income approach 
      valuation, comparable sales analysis, and current market conditions, supports a revised valuation 
      of $${property.marketValue?.toLocaleString()}. This adjustment reflects the property's actual 
      income-generating capacity, physical condition, and recent sales of similar properties in the area.`;
      
      setNarrative(mockNarrative);
    } finally {
      setIsGenerating(false);
    }
  }, [property]);

  const packetData: PacketData = {
    property,
    narrative: narrative || 'Click "Generate AI Narrative" to create a professional appeal narrative.',
    comparables: includeComparables ? [] : undefined, // Would be populated from API
    exhibits: includeExhibits ? [] : undefined, // Would be populated from uploads
    analysisDate: new Date(),
    analyst: {
      name: 'John Smith',
      title: 'Senior Tax Consultant',
      license: 'TC-12345'
    }
  };

  return (
    <Card className="packet-generator">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Tax Appeal Packet Generator</h2>
          <p className="text-gray-600">
            Generate a comprehensive, professional tax appeal packet for {property.address}
          </p>
        </div>

        <ProgressiveDisclosure title="Packet Configuration" defaultOpen>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="include-comparables"
                checked={includeComparables}
                onChange={(e) => setIncludeComparables(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="include-comparables" className="text-sm font-medium">
                Include Comparable Properties Analysis
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="include-exhibits"
                checked={includeExhibits}
                onChange={(e) => setIncludeExhibits(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="include-exhibits" className="text-sm font-medium">
                Include Supporting Exhibits
              </label>
            </div>
          </div>
        </ProgressiveDisclosure>

        <ProgressiveDisclosure title="AI-Generated Narrative">
          <div className="space-y-4">
            <Button
              onClick={generateNarrative}
              disabled={isGenerating}
              variant="secondary"
              size="medium"
            >
              {isGenerating ? 'Generating...' : 'Generate AI Narrative'}
            </Button>
            
            {narrative && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm leading-relaxed">{narrative}</p>
              </div>
            )}
          </div>
        </ProgressiveDisclosure>

        <div className="pt-4 border-t">
          <PDFDownloadLink
            document={<TaxAppealDocument data={packetData} />}
            fileName={`tax-appeal-${property.propertyId}-${new Date().toISOString().split('T')[0]}.pdf`}
          >
            {({ loading }) => (
              <Button
                variant="primary"
                size="large"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating PDF...' : 'Download Tax Appeal Packet'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>
    </Card>
  );
};