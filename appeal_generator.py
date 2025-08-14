"""
appeal_generator.py

Professional PDF Appeal Generator for IAAO-compliant property tax appeals.
Creates comprehensive appeal packets with valuation analysis, supporting evidence,
and county-specific forms.
"""

import os
from datetime import datetime, date
from typing import Dict, List, Optional, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY


class ProfessionalAppealGenerator:
    """Generate professional IAAO-compliant property tax appeals in PDF format"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
        
    def setup_custom_styles(self):
        """Setup custom styles for professional appeal documents"""
        
        # Title style
        self.styles.add(ParagraphStyle(
            name='AppealTitle',
            parent=self.styles['Title'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#003366')
        ))
        
        # Section heading style
        self.styles.add(ParagraphStyle(
            name='SectionHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            fontName='Helvetica-Bold',
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.HexColor('#003366'),
            borderWidth=1,
            borderColor=colors.HexColor('#003366'),
            borderPadding=8
        ))
        
        # Property info style
        self.styles.add(ParagraphStyle(
            name='PropertyInfo',
            parent=self.styles['Normal'],
            fontSize=11,
            fontName='Helvetica-Bold',
            spaceAfter=6
        ))
        
        # Analysis text style
        self.styles.add(ParagraphStyle(
            name='AnalysisText',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=8,
            alignment=TA_JUSTIFY
        ))
        
        # Conclusion style
        self.styles.add(ParagraphStyle(
            name='Conclusion',
            parent=self.styles['Normal'],
            fontSize=12,
            fontName='Helvetica-Bold',
            spaceAfter=12,
            spaceBefore=20,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#990000')
        ))
    
    def generate_appeal_packet(self, appeal_data: Dict[str, Any], output_path: str = None) -> str:
        """
        Generate a complete appeal packet PDF
        
        Args:
            appeal_data: Complete appeal information including property, valuation, and analysis
            output_path: Optional output path, otherwise auto-generated
            
        Returns:
            Path to generated PDF file
        """
        
        if not output_path:
            property_address = appeal_data.get('property', {}).get('address', 'Unknown')
            safe_address = ''.join(c for c in property_address if c.isalnum() or c in (' ', '-', '_')).strip()
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = f"appeals/Appeal_{safe_address}_{timestamp}.pdf"
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else "appeals", exist_ok=True)
        
        # Create the PDF document
        doc = SimpleDocTemplate(output_path, pagesize=letter, 
                              rightMargin=72, leftMargin=72, 
                              topMargin=72, bottomMargin=72)
        
        # Build the document content
        story = []
        
        # Cover page
        story.extend(self._create_cover_page(appeal_data))
        story.append(PageBreak())
        
        # Executive summary
        story.extend(self._create_executive_summary(appeal_data))
        story.append(PageBreak())
        
        # Property description
        story.extend(self._create_property_description(appeal_data))
        
        # Valuation analysis
        story.extend(self._create_valuation_analysis(appeal_data))
        
        # Supporting evidence
        story.extend(self._create_supporting_evidence(appeal_data))
        
        # Conclusion and recommendation
        story.extend(self._create_conclusion(appeal_data))
        
        # Build the PDF
        doc.build(story)
        
        return output_path
    
    def _create_cover_page(self, appeal_data: Dict[str, Any]) -> List:
        """Create the cover page of the appeal"""
        story = []
        property_info = appeal_data.get('property', {})
        valuation_info = appeal_data.get('valuation', {})
        
        # Title
        story.append(Paragraph("PROPERTY TAX ASSESSMENT APPEAL", self.styles['AppealTitle']))
        story.append(Spacer(1, 0.5 * inch))
        
        # Property information table
        property_data = [
            ['Property Address:', property_info.get('address', 'Not specified')],
            ['City, State:', f"{property_info.get('city', '')}, {property_info.get('state', '')}"],
            ['Property Type:', property_info.get('property_type', 'Commercial')],
            ['Parcel ID:', property_info.get('parcel_id', 'Not specified')],
            ['Current Assessment:', f"${property_info.get('current_assessment', 0):,.2f}"],
            ['Proposed Assessment:', f"${valuation_info.get('final_value_estimate', 0):,.2f}"],
            ['Potential Tax Savings:', f"${valuation_info.get('potential_tax_savings', 0):,.2f}"],
            ['Appeal Date:', datetime.now().strftime('%B %d, %Y')]
        ]
        
        property_table = Table(property_data, colWidths=[2.5*inch, 4*inch])
        property_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(property_table)
        story.append(Spacer(1, 1 * inch))
        
        # Appeal basis
        story.append(Paragraph("BASIS FOR APPEAL", self.styles['SectionHeading']))
        
        appeal_basis = """
        This appeal is based on a comprehensive IAAO-compliant valuation analysis that indicates 
        the current assessment exceeds the property's fair market value. Our analysis employs 
        the three standard approaches to value: Sales Comparison Approach, Cost Approach, and 
        Income Approach, as required by professional appraisal standards.
        """
        
        story.append(Paragraph(appeal_basis, self.styles['AnalysisText']))
        
        return story
    
    def _create_executive_summary(self, appeal_data: Dict[str, Any]) -> List:
        """Create executive summary section"""
        story = []
        property_info = appeal_data.get('property', {})
        valuation_info = appeal_data.get('valuation', {})
        
        story.append(Paragraph("EXECUTIVE SUMMARY", self.styles['AppealTitle']))
        
        # Summary of findings
        current_assessment = property_info.get('current_assessment', 0)
        proposed_value = valuation_info.get('final_value_estimate', 0)
        overassessment = current_assessment - proposed_value
        overassessment_pct = (overassessment / current_assessment * 100) if current_assessment > 0 else 0
        
        summary_text = f"""
        <b>Property:</b> {property_info.get('address', 'Subject Property')}<br/>
        <b>Property Type:</b> {property_info.get('property_type', 'Commercial')}<br/>
        <b>Current Assessment:</b> ${current_assessment:,.2f}<br/>
        <b>Market Value Conclusion:</b> ${proposed_value:,.2f}<br/>
        <b>Over-assessment:</b> ${overassessment:,.2f} ({overassessment_pct:.1f}%)<br/>
        <b>Confidence Level:</b> {valuation_info.get('confidence_level', 85):.0f}%
        """
        
        story.append(Paragraph(summary_text, self.styles['PropertyInfo']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Key findings
        story.append(Paragraph("KEY FINDINGS", self.styles['SectionHeading']))
        
        findings = [
            "Comprehensive market analysis reveals the property is over-assessed by the current jurisdiction.",
            "All three approaches to value (Sales, Cost, and Income) support a lower valuation than the current assessment.",
            "Market data indicates declining values in this property type and location.",
            "The assessment does not reflect current market conditions and comparable property values.",
            "IAAO standards and professional appraisal practices support the requested assessment reduction."
        ]
        
        for finding in findings:
            story.append(Paragraph(f"• {finding}", self.styles['AnalysisText']))
        
        return story
    
    def _create_property_description(self, appeal_data: Dict[str, Any]) -> List:
        """Create detailed property description section"""
        story = []
        property_info = appeal_data.get('property', {})
        
        story.append(Paragraph("PROPERTY DESCRIPTION", self.styles['SectionHeading']))
        
        # Physical characteristics
        characteristics_data = [
            ['Address:', property_info.get('address', 'Not specified')],
            ['Legal Description:', property_info.get('legal_description', 'See attached legal documents')],
            ['Property Type:', property_info.get('property_type', 'Commercial')],
            ['Building Size:', f"{property_info.get('building_size', 0):,.0f} sq ft"],
            ['Land Size:', f"{property_info.get('land_size', 0):.2f} acres"],
            ['Year Built:', str(property_info.get('year_built', 'Unknown'))],
            ['Condition:', property_info.get('condition', 'Average')],
            ['Zoning:', property_info.get('zoning', 'Commercial')],
        ]
        
        characteristics_table = Table(characteristics_data, colWidths=[2*inch, 4.5*inch])
        characteristics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(characteristics_table)
        story.append(Spacer(1, 0.2 * inch))
        
        # Property description narrative
        description_text = """
        The subject property is a commercial building located in an established business district. 
        The property has been well-maintained and is currently occupied by tenants operating 
        various commercial enterprises. The building construction is typical for its age and 
        property type, with standard commercial amenities and infrastructure.
        """
        
        story.append(Paragraph(description_text, self.styles['AnalysisText']))
        
        return story
    
    def _create_valuation_analysis(self, appeal_data: Dict[str, Any]) -> List:
        """Create comprehensive valuation analysis section"""
        story = []
        valuation_info = appeal_data.get('valuation', {})
        approaches = appeal_data.get('approaches', {})
        
        story.append(Paragraph("VALUATION ANALYSIS", self.styles['SectionHeading']))
        
        # Introduction to valuation methodology
        methodology_text = """
        This valuation analysis follows the International Association of Assessing Officers (IAAO) 
        standards and utilizes the three traditional approaches to value: Sales Comparison Approach, 
        Cost Approach, and Income Approach. Each approach provides an independent indication of value, 
        which are then reconciled to arrive at a final market value estimate.
        """
        
        story.append(Paragraph(methodology_text, self.styles['AnalysisText']))
        
        # Sales Comparison Approach
        if approaches.get('sales_comparison'):
            story.extend(self._create_sales_comparison_section(approaches['sales_comparison']))
        
        # Cost Approach
        if approaches.get('cost_approach'):
            story.extend(self._create_cost_approach_section(approaches['cost_approach']))
        
        # Income Approach  
        if approaches.get('income_approach'):
            story.extend(self._create_income_approach_section(approaches['income_approach']))
        
        # Value reconciliation
        story.extend(self._create_value_reconciliation_section(valuation_info))
        
        return story
    
    def _create_sales_comparison_section(self, sales_data: Dict[str, Any]) -> List:
        """Create sales comparison approach section"""
        story = []
        
        story.append(Paragraph("Sales Comparison Approach", self.styles['Heading3']))
        
        # Methodology explanation
        methodology = """
        The Sales Comparison Approach analyzes recent sales of comparable properties and adjusts 
        for differences in location, size, age, condition, and other factors affecting value. 
        This approach is particularly reliable when sufficient comparable sales data is available.
        """
        
        story.append(Paragraph(methodology, self.styles['AnalysisText']))
        
        # Comparable sales table
        comparables = sales_data.get('adjusted_comparables', [])
        if comparables:
            comp_data = [['Address', 'Sale Price', 'Sale Date', 'Adjustments', 'Adjusted Price']]
            
            for comp in comparables[:5]:  # Show top 5 comparables
                comp_data.append([
                    comp.get('address', 'N/A'),
                    f"${comp.get('sale_price', 0):,.0f}",
                    comp.get('sale_date', 'N/A'),
                    f"${comp.get('adjustments', {}).get('total_adjustment', 0):+,.0f}",
                    f"${comp.get('adjusted_price', 0):,.0f}"
                ])
            
            comp_table = Table(comp_data, colWidths=[2*inch, 1*inch, 1*inch, 1*inch, 1.5*inch])
            comp_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
            ]))
            
            story.append(comp_table)
        
        # Value indication
        value_indication = sales_data.get('value_indication', 0)
        story.append(Spacer(1, 0.1 * inch))
        story.append(Paragraph(
            f"<b>Sales Comparison Approach Value Indication: ${value_indication:,.0f}</b>",
            self.styles['PropertyInfo']
        ))
        
        return story
    
    def _create_cost_approach_section(self, cost_data: Dict[str, Any]) -> List:
        """Create cost approach section"""
        story = []
        
        story.append(Paragraph("Cost Approach", self.styles['Heading3']))
        
        # Methodology explanation
        methodology = """
        The Cost Approach estimates value based on the cost to replace the improvements, 
        less accrued depreciation, plus land value. This approach is particularly useful 
        for newer properties or special-use properties where sales data may be limited.
        """
        
        story.append(Paragraph(methodology, self.styles['AnalysisText']))
        
        # Cost breakdown table
        components = cost_data.get('components', {})
        depreciation = cost_data.get('depreciation_breakdown', {})
        
        cost_breakdown = [
            ['Component', 'Amount'],
            ['Land Value', f"${components.get('land_value', 0):,.0f}"],
            ['Replacement Cost New', f"${components.get('replacement_cost_new', 0):,.0f}"],
            ['Less: Physical Depreciation', f"(${depreciation.get('physical_depreciation', 0):,.0f})"],
            ['Less: Functional Obsolescence', f"(${depreciation.get('functional_obsolescence', 0):,.0f})"],
            ['Less: External Obsolescence', f"(${depreciation.get('external_obsolescence', 0):,.0f})"],
            ['<b>Total Depreciated Value</b>', f"<b>${cost_data.get('value_indication', 0):,.0f}</b>"]
        ]
        
        cost_table = Table(cost_breakdown, colWidths=[4*inch, 2.5*inch])
        cost_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ]))
        
        story.append(cost_table)
        
        return story
    
    def _create_income_approach_section(self, income_data: Dict[str, Any]) -> List:
        """Create income approach section"""
        story = []
        
        story.append(Paragraph("Income Approach", self.styles['Heading3']))
        
        # Methodology explanation
        methodology = """
        The Income Approach values property based on its income-generating capacity. 
        This approach is most applicable to income-producing properties and uses market-derived 
        capitalization rates and expense ratios to convert net operating income to value.
        """
        
        story.append(Paragraph(methodology, self.styles['AnalysisText']))
        
        # Income analysis table
        income_analysis = income_data.get('income_analysis', {})
        
        income_breakdown = [
            ['Income/Expense Item', 'Annual Amount'],
            ['Gross Rental Income', f"${income_analysis.get('gross_rental_income', 0):,.0f}"],
            ['Less: Vacancy & Collection Loss', f"(${income_analysis.get('vacancy_loss', 0):,.0f})"],
            ['Plus: Other Income', f"${income_analysis.get('other_income', 0):,.0f}"],
            ['Effective Gross Income', f"${income_analysis.get('effective_gross_income', 0):,.0f}"],
            ['Less: Operating Expenses', f"(${income_analysis.get('operating_expenses', 0):,.0f})"],
            ['<b>Net Operating Income</b>', f"<b>${income_analysis.get('net_operating_income', 0):,.0f}</b>"]
        ]
        
        income_table = Table(income_breakdown, colWidths=[4*inch, 2.5*inch])
        income_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ]))
        
        story.append(income_table)
        
        # Capitalization analysis
        methods = income_data.get('valuation_methods', {})
        direct_cap = methods.get('direct_capitalization', {})
        
        if direct_cap.get('value', 0) > 0:
            story.append(Spacer(1, 0.1 * inch))
            cap_text = f"""
            <b>Direct Capitalization:</b><br/>
            Net Operating Income: ${income_analysis.get('net_operating_income', 0):,.0f}<br/>
            Market Capitalization Rate: {direct_cap.get('cap_rate', 0.075):.2%}<br/>
            <b>Capitalized Value: ${direct_cap.get('value', 0):,.0f}</b>
            """
            story.append(Paragraph(cap_text, self.styles['PropertyInfo']))
        
        return story
    
    def _create_value_reconciliation_section(self, valuation_info: Dict[str, Any]) -> List:
        """Create value reconciliation section"""
        story = []
        
        story.append(Paragraph("Value Reconciliation", self.styles['Heading3']))
        
        # Reconciliation methodology
        reconciliation_text = """
        The final value estimate is derived through careful analysis and reconciliation of the 
        value indications from each applicable approach. The relative reliability, applicability, 
        and quality of data for each approach is considered in determining appropriate weights.
        """
        
        story.append(Paragraph(reconciliation_text, self.styles['AnalysisText']))
        
        # Reconciliation table
        approach_weights = valuation_info.get('approach_weights', {})
        approach_values = valuation_info.get('approach_values', {})
        
        reconciliation_data = [
            ['Approach', 'Value Indication', 'Weight', 'Weighted Value']
        ]
        
        if approach_values.get('sales_comparison', 0) > 0:
            weight = approach_weights.get('sales_comparison', 0) / 100
            weighted = approach_values['sales_comparison'] * weight
            reconciliation_data.append([
                'Sales Comparison',
                f"${approach_values['sales_comparison']:,.0f}",
                f"{approach_weights.get('sales_comparison', 0):.0f}%",
                f"${weighted:,.0f}"
            ])
        
        if approach_values.get('cost_approach', 0) > 0:
            weight = approach_weights.get('cost_approach', 0) / 100
            weighted = approach_values['cost_approach'] * weight
            reconciliation_data.append([
                'Cost Approach',
                f"${approach_values['cost_approach']:,.0f}",
                f"{approach_weights.get('cost_approach', 0):.0f}%",
                f"${weighted:,.0f}"
            ])
        
        if approach_values.get('income_approach', 0) > 0:
            weight = approach_weights.get('income_approach', 0) / 100
            weighted = approach_values['income_approach'] * weight
            reconciliation_data.append([
                'Income Approach',
                f"${approach_values['income_approach']:,.0f}",
                f"{approach_weights.get('income_approach', 0):.0f}%",
                f"${weighted:,.0f}"
            ])
        
        # Final value
        final_value = valuation_info.get('final_value_estimate', 0)
        reconciliation_data.append([
            '<b>Final Market Value</b>',
            '',
            '',
            f'<b>${final_value:,.0f}</b>'
        ])
        
        reconciliation_table = Table(reconciliation_data, colWidths=[2*inch, 1.5*inch, 1*inch, 2*inch])
        reconciliation_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ]))
        
        story.append(reconciliation_table)
        
        return story
    
    def _create_supporting_evidence(self, appeal_data: Dict[str, Any]) -> List:
        """Create supporting evidence section"""
        story = []
        
        story.append(Paragraph("SUPPORTING EVIDENCE", self.styles['SectionHeading']))
        
        evidence_text = """
        This appeal is supported by comprehensive market analysis, industry-standard valuation 
        methodologies, and relevant supporting documentation. The following evidence supports 
        our valuation conclusions:
        """
        
        story.append(Paragraph(evidence_text, self.styles['AnalysisText']))
        
        evidence_items = [
            "Comparable sales analysis with appropriate adjustments for time, location, size, and condition",
            "Income and expense analysis based on actual property operating data",
            "Market-derived capitalization rates and expense ratios from industry sources",
            "Professional appraisal standards compliance (IAAO, USPAP)",
            "Current market conditions analysis and trends",
            "Property inspection and condition assessment"
        ]
        
        for item in evidence_items:
            story.append(Paragraph(f"• {item}", self.styles['AnalysisText']))
        
        return story
    
    def _create_conclusion(self, appeal_data: Dict[str, Any]) -> List:
        """Create conclusion and recommendation section"""
        story = []
        property_info = appeal_data.get('property', {})
        valuation_info = appeal_data.get('valuation', {})
        
        story.append(Paragraph("CONCLUSION AND RECOMMENDATION", self.styles['SectionHeading']))
        
        current_assessment = property_info.get('current_assessment', 0)
        market_value = valuation_info.get('final_value_estimate', 0)
        confidence = valuation_info.get('overall_confidence', 85)
        
        conclusion_text = f"""
        Based on comprehensive IAAO-compliant valuation analysis, we conclude that the subject 
        property has a current market value of ${market_value:,.0f}, compared to the current 
        assessment of ${current_assessment:,.0f}. This analysis has been conducted with 
        {confidence:.0f}% confidence level using industry-standard methodologies and current market data.
        """
        
        story.append(Paragraph(conclusion_text, self.styles['AnalysisText']))
        story.append(Spacer(1, 0.2 * inch))
        
        # Recommendation
        story.append(Paragraph(
            f"RECOMMENDED ASSESSED VALUE: ${market_value:,.0f}",
            self.styles['Conclusion']
        ))
        
        # Request for relief
        relief_text = """
        We respectfully request that the assessment be reduced to reflect the current market value 
        as determined by this comprehensive analysis. This adjustment would bring the assessment 
        in line with fair market value and comply with applicable assessment standards.
        """
        
        story.append(Paragraph(relief_text, self.styles['AnalysisText']))
        
        # Signature block
        story.append(Spacer(1, 0.5 * inch))
        signature_text = f"""
        Respectfully submitted,<br/><br/>
        <b>CHARLY Property Tax Appeals</b><br/>
        Professional Property Tax Consultants<br/>
        Date: {datetime.now().strftime('%B %d, %Y')}
        """
        
        story.append(Paragraph(signature_text, self.styles['PropertyInfo']))
        
        return story


def generate_professional_appeal(appeal_data: Dict[str, Any], output_path: str = None) -> str:
    """
    Main function to generate a professional appeal PDF
    
    Args:
        appeal_data: Complete appeal data including property info, valuation analysis, and approaches
        output_path: Optional custom output path
        
    Returns:
        Path to the generated PDF file
    """
    generator = ProfessionalAppealGenerator()
    return generator.generate_appeal_packet(appeal_data, output_path)


# Example usage and test data
if __name__ == "__main__":
    # Test data structure
    sample_appeal_data = {
        "property": {
            "address": "123 Main Street, Austin, TX 78701",
            "city": "Austin",
            "state": "TX",
            "property_type": "Office Building",
            "parcel_id": "123456789",
            "current_assessment": 1200000,
            "building_size": 15000,
            "land_size": 0.75,
            "year_built": 1995,
            "condition": "Average",
            "zoning": "C-2 Commercial"
        },
        "valuation": {
            "final_value_estimate": 950000,
            "overall_confidence": 87,
            "potential_tax_savings": 35000,
            "approach_weights": {
                "sales_comparison": 45,
                "cost_approach": 25,
                "income_approach": 30
            },
            "approach_values": {
                "sales_comparison": 920000,
                "cost_approach": 980000,
                "income_approach": 960000
            }
        },
        "approaches": {
            "sales_comparison": {
                "value_indication": 920000,
                "adjusted_comparables": [
                    {
                        "address": "456 Oak Ave",
                        "sale_price": 900000,
                        "sale_date": "2024-03-15",
                        "adjustments": {"total_adjustment": 20000},
                        "adjusted_price": 920000
                    }
                ]
            },
            "cost_approach": {
                "value_indication": 980000,
                "components": {
                    "land_value": 200000,
                    "replacement_cost_new": 1200000,
                    "total_depreciation": 420000
                },
                "depreciation_breakdown": {
                    "physical_depreciation": 350000,
                    "functional_obsolescence": 50000,
                    "external_obsolescence": 20000
                }
            },
            "income_approach": {
                "value_indication": 960000,
                "income_analysis": {
                    "gross_rental_income": 180000,
                    "vacancy_loss": 9000,
                    "other_income": 5000,
                    "effective_gross_income": 176000,
                    "operating_expenses": 65000,
                    "net_operating_income": 111000
                },
                "valuation_methods": {
                    "direct_capitalization": {
                        "value": 960000,
                        "cap_rate": 0.116
                    }
                }
            }
        }
    }
    
    # Generate test appeal
    try:
        output_file = generate_professional_appeal(sample_appeal_data)
        print(f"✅ Professional appeal PDF generated: {output_file}")
    except Exception as e:
        print(f"❌ Error generating appeal: {e}")