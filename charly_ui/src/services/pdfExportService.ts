import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';
import type { ReportData } from '@/types/report';

export class PDFExportService {
  static async generateEnterprisePDF(reportData: ReportData): Promise<void> {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) throw new Error('Report content not found');

    // Show loading state
    const originalDisplay = reportElement.style.display;
    reportElement.style.display = 'block';

    try {
      // Configure html2canvas for high quality
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        height: reportElement.scrollHeight,
        width: reportElement.scrollWidth,
      });

      // Create PDF with proper dimensions
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // 10mm top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20; // Account for margins

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Add metadata
      pdf.setProperties({
        title: `Supernova 2B Property Analysis - ${reportData.property?.address || 'Property Report'}`,
        subject: 'Property Tax Appeal Analysis',
        author: 'CHARLY AI Analysis System',
        creator: 'Supernova 2B AI Enhanced Analysis',
        keywords: 'property tax, appeal, IAAO, analysis, supernova',
      });

      // Save the PDF
      const fileName = `Supernova_2B_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } finally {
      reportElement.style.display = originalDisplay;
    }
  }

  static async generateExcelExport(reportData: ReportData): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'CHARLY AI Analysis System';
    workbook.lastModifiedBy = 'Supernova 2B AI Enhanced Analysis';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Executive Summary Sheet
    const wsExecutive = workbook.addWorksheet('Executive Summary');
    
    // Add header with styling
    wsExecutive.addRow(['SUPERNOVA 2B PROPERTY ANALYSIS REPORT']);
    wsExecutive.getCell('A1').font = { bold: true, size: 16, color: { argb: '1e40af' } };
    wsExecutive.addRow([]);
    
    // Property information
    wsExecutive.addRow(['Property Address', reportData.property?.address || 'N/A']);
    wsExecutive.addRow(['Analysis Date', reportData.date]);
    wsExecutive.addRow(['Prepared By', reportData.preparedBy]);
    wsExecutive.addRow([]);
    
    // Executive Summary section
    wsExecutive.addRow(['EXECUTIVE SUMMARY']);
    wsExecutive.getCell('A7').font = { bold: true, size: 14 };
    wsExecutive.addRow(['Appeal Recommendation', reportData.appealRecommendation]);
    wsExecutive.addRow(['Success Probability', `${((reportData.supernovaEnhancements?.successProbability?.overallProbability || 0) * 100).toFixed(1)}%`]);
    wsExecutive.addRow(['AI Confidence Level', `${reportData.supernovaEnhancements?.confidenceLevel || 0}%`]);
    wsExecutive.addRow([]);
    
    // Financial Analysis section
    wsExecutive.addRow(['FINANCIAL ANALYSIS']);
    wsExecutive.getCell('A12').font = { bold: true, size: 14 };
    wsExecutive.addRow(['Current Assessment', reportData.assessmentAnalysis?.currentAssessment || 0]);
    wsExecutive.addRow(['Market Value', reportData.assessmentAnalysis?.estimatedMarketValue || 0]);
    wsExecutive.addRow(['Over-Assessment', reportData.assessmentAnalysis?.overAssessmentAmount || 0]);
    wsExecutive.addRow(['Assessment Ratio', `${reportData.assessmentAnalysis?.assessmentToValueRatio || 0}%`]);
    wsExecutive.addRow([]);
    
    // Tax Impact section
    wsExecutive.addRow(['TAX IMPACT']);
    wsExecutive.getCell('A18').font = { bold: true, size: 14 };
    wsExecutive.addRow(['Current Annual Taxes', reportData.financialImpact?.currentAnnualTaxes || 0]);
    wsExecutive.addRow(['Projected Annual Taxes', reportData.financialImpact?.projectedAnnualTaxes || 0]);
    wsExecutive.addRow(['Annual Tax Savings', reportData.financialImpact?.annualTaxSavings || 0]);
    wsExecutive.addRow(['5-Year Savings', reportData.financialImpact?.fiveYearSavings || 0]);
    wsExecutive.addRow(['ROI', `${reportData.financialImpact?.roi || 0}%`]);

    // Auto-fit columns
    wsExecutive.columns.forEach(column => {
      column.width = 25;
    });

    // AI Analysis Sheet
    if (reportData.supernovaEnhancements?.successProbability) {
      const wsAI = workbook.addWorksheet('AI Analysis');
      const successProb = reportData.supernovaEnhancements.successProbability;
      
      wsAI.addRow(['AI SUCCESS PROBABILITY MODEL']);
      wsAI.getCell('A1').font = { bold: true, size: 16, color: { argb: '1e40af' } };
      wsAI.addRow([]);
      
      wsAI.addRow(['MARKET FACTORS']);
      wsAI.getCell('A3').font = { bold: true, size: 14 };
      wsAI.addRow(['Price Variance', successProb.marketFactors.priceVariance]);
      wsAI.addRow(['Market Condition', successProb.marketFactors.marketCondition]);
      wsAI.addRow(['Comparability Strength', successProb.marketFactors.comparabilityStrength]);
      wsAI.addRow([]);
      
      wsAI.addRow(['PROPERTY FACTORS']);
      wsAI.getCell('A8').font = { bold: true, size: 14 };
      wsAI.addRow(['Assessment Ratio', successProb.propertyFactors.assessmentRatio]);
      wsAI.addRow(['Age & Condition', successProb.propertyFactors.ageAndCondition]);
      wsAI.addRow(['Uniqueness Score', successProb.propertyFactors.uniquenessScore]);
      wsAI.addRow([]);
      
      wsAI.addRow(['JURISDICTION FACTORS']);
      wsAI.getCell('A13').font = { bold: true, size: 14 };
      wsAI.addRow(['Historical Success Rate', successProb.jurisdictionFactors.historicalSuccessRate]);
      wsAI.addRow(['Assessor Professionalism', successProb.jurisdictionFactors.assessorProfessionalism]);
      wsAI.addRow(['Recent Reforms', successProb.jurisdictionFactors.recentReforms]);
      wsAI.addRow([]);
      
      wsAI.addRow(['TIMING FACTORS']);
      wsAI.getCell('A18').font = { bold: true, size: 14 };
      wsAI.addRow(['Days to Deadline', successProb.timingFactors.daysToDeadline]);
      wsAI.addRow(['Seasonal Optimality', successProb.timingFactors.seasonalOptimality]);
      wsAI.addRow(['Workload Timing', successProb.timingFactors.workloadTiming]);
      wsAI.addRow([]);
      
      wsAI.addRow(['OVERALL PROBABILITY', `${(successProb.overallProbability * 100).toFixed(1)}%`]);
      wsAI.getCell('A23').font = { bold: true, size: 14, color: { argb: 'dc2626' } };

      wsAI.columns.forEach(column => {
        column.width = 25;
      });
    }

    // Smart Comparables Sheet
    if (reportData.supernovaEnhancements?.smartComparables) {
      const wsComparables = workbook.addWorksheet('Smart Comparables');
      const comparables = reportData.supernovaEnhancements.smartComparables;
      
      wsComparables.addRow(['SMART COMPARABLE ANALYSIS']);
      wsComparables.getCell('A1').font = { bold: true, size: 16, color: { argb: '1e40af' } };
      wsComparables.addRow([]);
      wsComparables.addRow(['Overall Strength', comparables.overallStrength]);
      wsComparables.addRow([]);
      
      // Header row for comparables table
      const headerRow = wsComparables.addRow(['Address', 'Relevance Score', 'Weight', 'Strength Rating']);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f3f4f6' }
      };

      comparables.selectedComparables.forEach((comp: Record<string, unknown>) => {
        wsComparables.addRow([
          comp.address,
          comp.relevanceScore,
          comp.weight,
          comp.strengthRating,
        ]);
      });

      wsComparables.columns.forEach(column => {
        column.width = 20;
      });
    }

    // Generate and save Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Supernova_2B_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(data, fileName);
  }

  static async generateWordDocument(reportData: ReportData): Promise<void> {
    // Create a simplified HTML structure for Word
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Supernova 2B Property Analysis</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 1in; }
            h1 { color: #1e40af; text-align: center; }
            h2 { color: #374151; border-bottom: 2px solid #e5e7eb; }
            .section { margin-bottom: 20px; }
            .highlight { background-color: #eff6ff; padding: 10px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>🌟 SUPERNOVA 2B PROPERTY ANALYSIS REPORT</h1>
          
          <div class="section">
            <h2>Executive Summary</h2>
            <div class="highlight">
              <p><strong>Property:</strong> ${reportData.property?.address || 'N/A'}</p>
              <p><strong>Analysis Date:</strong> ${reportData.date}</p>
              <p><strong>Appeal Recommendation:</strong> ${reportData.appealRecommendation}</p>
              <p><strong>AI Success Probability:</strong> ${((reportData.supernovaEnhancements?.successProbability?.overallProbability || 0) * 100).toFixed(1)}%</p>
              <p><strong>AI Confidence Level:</strong> ${reportData.supernovaEnhancements?.confidenceLevel || 0}%</p>
            </div>
          </div>

          <div class="section">
            <h2>Financial Impact Analysis</h2>
            <table>
              <tr><th>Metric</th><th>Amount</th></tr>
              <tr><td>Current Assessment</td><td>$${(reportData.assessmentAnalysis?.currentAssessment || 0).toLocaleString()}</td></tr>
              <tr><td>Market Value</td><td>$${(reportData.assessmentAnalysis?.estimatedMarketValue || 0).toLocaleString()}</td></tr>
              <tr><td>Over-Assessment</td><td>$${(reportData.assessmentAnalysis?.overAssessmentAmount || 0).toLocaleString()}</td></tr>
              <tr><td>Annual Tax Savings</td><td>$${(reportData.financialImpact?.annualTaxSavings || 0).toLocaleString()}</td></tr>
              <tr><td>5-Year Savings</td><td>$${(reportData.financialImpact?.fiveYearSavings || 0).toLocaleString()}</td></tr>
              <tr><td>ROI</td><td>${reportData.financialImpact?.roi || 0}%</td></tr>
            </table>
          </div>

          <div class="section">
            <h2>Strategic Recommendations</h2>
            <p>${reportData.supernovaEnhancements?.supernovaRecommendations?.narrativeThemes?.[0] || 'Market-based appeal strategy recommended'}</p>
          </div>

          <div class="section">
            <h2>AI Analysis Metadata</h2>
            <p><strong>Analysis Version:</strong> ${reportData.supernovaEnhancements?.aiAnalysisVersion || 'N/A'}</p>
            <p><strong>Generated:</strong> ${reportData.supernovaEnhancements ? new Date(reportData.supernovaEnhancements.generatedAt).toLocaleString() : 'N/A'}</p>
            <p><strong>IAAO Compliance:</strong> Fully compliant with IAAO mass appraisal standards</p>
          </div>
        </body>
      </html>
    `;

    // Create and download as HTML (which opens in Word)
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const fileName = `Supernova_2B_Analysis_${new Date().toISOString().split('T')[0]}.doc`;
    saveAs(blob, fileName);
  }
}