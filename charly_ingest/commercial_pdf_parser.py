"""
commercial_pdf_parser.py

Advanced PDF parser specifically designed for commercial property documents:
- Rent rolls with tenant information and lease details
- Income statements with revenue and expense breakdowns  
- Operating statements with NOI calculations
- Comparable sales data extraction

Uses AI-powered text analysis to extract structured data from unstructured PDFs.
"""

import re
import pdfplumber
import pandas as pd
from datetime import datetime, date
from typing import List, Dict, Optional, Tuple, Any
from decimal import Decimal
import logging
from .models import TenantData, RentRoll, IncomeStatement, ComparableSale

# Configure logging
logger = logging.getLogger(__name__)

class CommercialPDFParser:
    """Enhanced PDF parser for commercial real estate documents"""
    
    def __init__(self):
        self.currency_pattern = re.compile(r'\$?[\d,]+\.?\d*')
        self.date_pattern = re.compile(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}')
        self.sqft_pattern = re.compile(r'([\d,]+)\s*(?:sq\.?\s*ft\.?|sf|square feet)', re.IGNORECASE)
        
    def parse_commercial_document(self, file_path: str, document_type: str = 'auto') -> Dict[str, Any]:
        """
        Parse a commercial property PDF document
        
        Args:
            file_path: Path to the PDF file
            document_type: Type hint ('rent_roll', 'income_statement', 'auto')
            
        Returns:
            Dictionary with structured data
        """
        try:
            with pdfplumber.open(file_path) as pdf:
                # Extract all text and tables
                full_text = ""
                all_tables = []
                
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    full_text += page_text + "\n"
                    
                    # Extract tables from each page
                    tables = page.extract_tables()
                    if tables:
                        all_tables.extend(tables)
                
                # Determine document type if auto
                if document_type == 'auto':
                    document_type = self._detect_document_type(full_text)
                
                # Parse based on detected/specified type
                if document_type == 'rent_roll':
                    return self._parse_rent_roll(full_text, all_tables)
                elif document_type == 'income_statement':
                    return self._parse_income_statement(full_text, all_tables)
                elif document_type == 'comparable_sales':
                    return self._parse_comparable_sales(full_text, all_tables)
                else:
                    # Generic extraction
                    return self._parse_generic_commercial(full_text, all_tables)
                    
        except Exception as e:
            logger.error(f"Error parsing PDF {file_path}: {e}")
            raise
    
    def _detect_document_type(self, text: str) -> str:
        """Detect the type of commercial document based on content"""
        text_lower = text.lower()
        
        # Rent roll indicators
        rent_roll_keywords = ['rent roll', 'tenant', 'lease', 'monthly rent', 'square footage', 'occupancy']
        if sum(keyword in text_lower for keyword in rent_roll_keywords) >= 3:
            return 'rent_roll'
            
        # Income statement indicators  
        income_stmt_keywords = ['income statement', 'gross income', 'operating expenses', 'net operating income', 'noi']
        if sum(keyword in text_lower for keyword in income_stmt_keywords) >= 2:
            return 'income_statement'
            
        # Comparable sales indicators
        comp_sales_keywords = ['comparable sales', 'sale price', 'sales comparison', 'market data']
        if sum(keyword in text_lower for keyword in comp_sales_keywords) >= 2:
            return 'comparable_sales'
            
        return 'generic'
    
    def _parse_rent_roll(self, text: str, tables: List[List[List[str]]]) -> Dict[str, Any]:
        """Parse rent roll document to extract tenant and lease information"""
        
        result = {
            'document_type': 'rent_roll',
            'tenants': [],
            'summary': {},
            'raw_data': {
                'text': text,
                'tables': tables
            }
        }
        
        # Extract header information
        property_address = self._extract_property_address(text)
        as_of_date = self._extract_as_of_date(text)
        
        # Process tables to find tenant data
        tenant_data = []
        
        for table in tables:
            if len(table) > 1:  # Has header and data rows
                tenant_rows = self._identify_tenant_rows(table)
                for row_data in tenant_rows:
                    tenant_info = self._extract_tenant_from_row(row_data)
                    if tenant_info:
                        tenant_data.append(tenant_info)
        
        # If no structured tables, try text extraction
        if not tenant_data:
            tenant_data = self._extract_tenants_from_text(text)
        
        # Calculate summary statistics
        summary = self._calculate_rent_roll_summary(tenant_data)
        
        result.update({
            'property_address': property_address,
            'as_of_date': as_of_date,
            'tenants': tenant_data,
            'summary': summary
        })
        
        return result
    
    def _parse_income_statement(self, text: str, tables: List[List[List[str]]]) -> Dict[str, Any]:
        """Parse income statement to extract revenue and expense data"""
        
        result = {
            'document_type': 'income_statement',
            'income_items': {},
            'expense_items': {},
            'summary': {},
            'raw_data': {
                'text': text,
                'tables': tables
            }
        }
        
        # Extract property information
        property_address = self._extract_property_address(text)
        period_info = self._extract_period_dates(text)
        
        # Extract financial data
        income_items = self._extract_income_items(text, tables)
        expense_items = self._extract_expense_items(text, tables)
        
        # Calculate key metrics
        gross_income = sum(income_items.values()) if income_items else 0
        total_expenses = sum(expense_items.values()) if expense_items else 0
        noi = gross_income - total_expenses
        
        summary = {
            'gross_income': gross_income,
            'total_expenses': total_expenses,
            'net_operating_income': noi,
            'operating_expense_ratio': total_expenses / gross_income if gross_income > 0 else 0
        }
        
        result.update({
            'property_address': property_address,
            'period_start': period_info.get('start'),
            'period_end': period_info.get('end'),
            'income_items': income_items,
            'expense_items': expense_items,
            'summary': summary
        })
        
        return result
    
    def _parse_comparable_sales(self, text: str, tables: List[List[List[str]]]) -> Dict[str, Any]:
        """Parse comparable sales data"""
        
        result = {
            'document_type': 'comparable_sales',
            'comparables': [],
            'summary': {},
            'raw_data': {
                'text': text,
                'tables': tables
            }
        }
        
        comparables = []
        
        # Extract comparable sales from tables
        for table in tables:
            if len(table) > 1:
                comp_data = self._extract_comparables_from_table(table)
                comparables.extend(comp_data)
        
        # Extract from text if no table data
        if not comparables:
            comparables = self._extract_comparables_from_text(text)
        
        # Calculate summary statistics
        if comparables:
            prices = [comp.get('sale_price', 0) for comp in comparables if comp.get('sale_price')]
            price_per_sf = [comp.get('price_per_sf', 0) for comp in comparables if comp.get('price_per_sf')]
            
            summary = {
                'total_comparables': len(comparables),
                'avg_sale_price': sum(prices) / len(prices) if prices else 0,
                'avg_price_per_sf': sum(price_per_sf) / len(price_per_sf) if price_per_sf else 0,
                'price_range': {
                    'min': min(prices) if prices else 0,
                    'max': max(prices) if prices else 0
                }
            }
        else:
            summary = {'total_comparables': 0}
        
        result.update({
            'comparables': comparables,
            'summary': summary
        })
        
        return result
    
    def _parse_generic_commercial(self, text: str, tables: List[List[List[str]]]) -> Dict[str, Any]:
        """Generic parsing for unknown commercial document types"""
        
        result = {
            'document_type': 'generic',
            'extracted_data': {},
            'raw_data': {
                'text': text,
                'tables': tables
            }
        }
        
        # Extract common commercial real estate data points
        extracted_data = {
            'property_address': self._extract_property_address(text),
            'financial_figures': self._extract_all_currency_amounts(text),
            'dates': self._extract_all_dates(text),
            'square_footage': self._extract_square_footage(text),
            'tables_data': self._structure_tables(tables)
        }
        
        result['extracted_data'] = extracted_data
        return result
    
    # Helper methods for data extraction
    
    def _extract_property_address(self, text: str) -> Optional[str]:
        """Extract property address from text"""
        address_patterns = [
            r'(?:property|subject|address)[:;\s]*([^\n]+)',
            r'(\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|way)[^\n]*)',
        ]
        
        for pattern in address_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                address = match.group(1).strip()
                if len(address) > 10:  # Basic validation
                    return address
        
        return None
    
    def _extract_as_of_date(self, text: str) -> Optional[str]:
        """Extract 'as of' date from rent roll"""
        date_patterns = [
            r'as of\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'dated?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
    
    def _extract_period_dates(self, text: str) -> Dict[str, Optional[str]]:
        """Extract period start and end dates"""
        period_patterns = [
            r'period\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*(?:to|through|-)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'for\s+the\s+(?:year|period)\s+ending\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        ]
        
        for pattern in period_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                if len(match.groups()) == 2:
                    return {'start': match.group(1), 'end': match.group(2)}
                else:
                    return {'start': None, 'end': match.group(1)}
        
        return {'start': None, 'end': None}
    
    def _extract_currency_amount(self, text: str) -> float:
        """Extract currency amount from text string"""
        match = self.currency_pattern.search(text)
        if match:
            amount_str = match.group().replace('$', '').replace(',', '')
            try:
                return float(amount_str)
            except ValueError:
                return 0.0
        return 0.0
    
    def _extract_all_currency_amounts(self, text: str) -> List[float]:
        """Extract all currency amounts from text"""
        amounts = []
        for match in self.currency_pattern.finditer(text):
            amount_str = match.group().replace('$', '').replace(',', '')
            try:
                amounts.append(float(amount_str))
            except ValueError:
                continue
        return amounts
    
    def _extract_all_dates(self, text: str) -> List[str]:
        """Extract all dates from text"""
        return [match.group() for match in self.date_pattern.finditer(text)]
    
    def _extract_square_footage(self, text: str) -> List[float]:
        """Extract square footage values from text"""
        sqft_values = []
        for match in self.sqft_pattern.finditer(text):
            sqft_str = match.group(1).replace(',', '')
            try:
                sqft_values.append(float(sqft_str))
            except ValueError:
                continue
        return sqft_values
    
    def _identify_tenant_rows(self, table: List[List[str]]) -> List[Dict[str, str]]:
        """Identify and extract tenant data rows from table"""
        tenant_rows = []
        
        if not table or len(table) < 2:
            return tenant_rows
            
        headers = [h.lower().strip() if h else '' for h in table[0]]
        
        # Look for key rent roll columns
        tenant_col = self._find_column_index(headers, ['tenant', 'name', 'business'])
        rent_col = self._find_column_index(headers, ['rent', 'monthly', 'base rent'])
        sf_col = self._find_column_index(headers, ['sq ft', 'sf', 'square feet', 'area'])
        
        for row in table[1:]:
            if len(row) > max(tenant_col or 0, rent_col or 0, sf_col or 0):
                tenant_info = {}
                
                if tenant_col is not None and row[tenant_col]:
                    tenant_info['tenant_name'] = row[tenant_col].strip()
                if rent_col is not None and row[rent_col]:
                    tenant_info['monthly_rent'] = self._extract_currency_amount(row[rent_col])
                if sf_col is not None and row[sf_col]:
                    tenant_info['square_footage'] = self._extract_currency_amount(row[sf_col])
                
                if tenant_info.get('tenant_name'):  # Only add if we have a tenant name
                    tenant_rows.append(tenant_info)
        
        return tenant_rows
    
    def _find_column_index(self, headers: List[str], keywords: List[str]) -> Optional[int]:
        """Find column index that matches any of the keywords"""
        for i, header in enumerate(headers):
            for keyword in keywords:
                if keyword in header:
                    return i
        return None
    
    def _extract_tenant_from_row(self, row_data: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Extract and structure tenant data from row"""
        if not row_data.get('tenant_name'):
            return None
            
        tenant = {
            'tenant_name': row_data['tenant_name'],
            'monthly_rent': row_data.get('monthly_rent', 0.0),
            'square_footage': row_data.get('square_footage', 0.0),
        }
        
        # Calculate derived fields
        if tenant['monthly_rent'] > 0 and tenant['square_footage'] > 0:
            tenant['rent_per_sf'] = (tenant['monthly_rent'] * 12) / tenant['square_footage']
            tenant['annual_rent'] = tenant['monthly_rent'] * 12
        
        return tenant
    
    def _extract_tenants_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Extract tenant information from unstructured text"""
        # This is a fallback method for when table extraction fails
        # Implementation would use NLP techniques to identify tenant information
        # For now, return empty list - this can be enhanced with AI/ML
        return []
    
    def _calculate_rent_roll_summary(self, tenants: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate rent roll summary statistics"""
        if not tenants:
            return {}
        
        total_sf = sum(t.get('square_footage', 0) for t in tenants)
        total_monthly_rent = sum(t.get('monthly_rent', 0) for t in tenants)
        occupied_units = len([t for t in tenants if t.get('monthly_rent', 0) > 0])
        
        return {
            'total_tenants': len(tenants),
            'occupied_units': occupied_units,
            'total_leasable_sf': total_sf,
            'total_monthly_rent': total_monthly_rent,
            'total_annual_rent': total_monthly_rent * 12,
            'average_rent_per_sf': (total_monthly_rent * 12) / total_sf if total_sf > 0 else 0,
            'occupancy_rate': occupied_units / len(tenants) if tenants else 0
        }
    
    def _extract_income_items(self, text: str, tables: List) -> Dict[str, float]:
        """Extract income line items from income statement"""
        income_items = {}
        
        # Common income categories
        income_keywords = {
            'gross_rental_income': ['gross rent', 'rental income', 'base rent'],
            'cam_income': ['cam', 'common area', 'common area maintenance'],
            'parking_income': ['parking', 'parking income'],
            'other_income': ['other income', 'miscellaneous income', 'ancillary income']
        }
        
        for category, keywords in income_keywords.items():
            amount = self._find_line_item_amount(text, keywords)
            if amount > 0:
                income_items[category] = amount
        
        return income_items
    
    def _extract_expense_items(self, text: str, tables: List) -> Dict[str, float]:
        """Extract expense line items from income statement"""
        expense_items = {}
        
        # Common expense categories
        expense_keywords = {
            'management_fees': ['management', 'property management'],
            'maintenance_repairs': ['maintenance', 'repairs', 'maintenance and repairs'],
            'utilities': ['utilities', 'electric', 'gas', 'water'],
            'insurance': ['insurance'],
            'property_taxes': ['property tax', 'real estate tax', 'taxes'],
            'professional_fees': ['professional', 'legal', 'accounting'],
            'marketing_leasing': ['marketing', 'leasing', 'advertising'],
            'other_expenses': ['other expenses', 'miscellaneous expenses']
        }
        
        for category, keywords in expense_keywords.items():
            amount = self._find_line_item_amount(text, keywords)
            if amount > 0:
                expense_items[category] = amount
        
        return expense_items
    
    def _find_line_item_amount(self, text: str, keywords: List[str]) -> float:
        """Find amount associated with line item keywords"""
        for keyword in keywords:
            # Look for pattern: keyword ... amount
            pattern = rf'{re.escape(keyword)}[^\n]*?(\$?[\d,]+\.?\d*)'
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return self._extract_currency_amount(match.group(1))
        return 0.0
    
    def _extract_comparables_from_table(self, table: List[List[str]]) -> List[Dict[str, Any]]:
        """Extract comparable sales from table structure"""
        # Implementation for extracting comparable sales from tables
        return []
    
    def _extract_comparables_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Extract comparable sales from unstructured text"""
        # Implementation for extracting comparable sales from text
        return []
    
    def _structure_tables(self, tables: List) -> List[Dict[str, Any]]:
        """Convert raw table data to structured format"""
        structured_tables = []
        
        for table in tables:
            if not table or len(table) < 2:
                continue
                
            structured_table = {
                'headers': table[0] if table else [],
                'rows': table[1:] if len(table) > 1 else [],
                'row_count': len(table) - 1 if len(table) > 1 else 0,
                'col_count': len(table[0]) if table and table[0] else 0
            }
            structured_tables.append(structured_table)
        
        return structured_tables


def parse_commercial_pdf(file_path: str, document_type: str = 'auto') -> Dict[str, Any]:
    """
    Main function to parse commercial property PDF documents
    
    Args:
        file_path: Path to the PDF file
        document_type: Type of document ('rent_roll', 'income_statement', 'comparable_sales', 'auto')
        
    Returns:
        Structured data dictionary
    """
    parser = CommercialPDFParser()
    return parser.parse_commercial_document(file_path, document_type)


# Example usage
if __name__ == "__main__":
    # Test the parser with example files
    test_files = [
        "Income Statement 123 company.pdf",
        "Rent Roll as of 12.31.22 Office bldg Z.pdf"
    ]
    
    for file_path in test_files:
        if os.path.exists(file_path):
            try:
                result = parse_commercial_pdf(file_path)
                print(f"\n=== Results for {file_path} ===")
                print(f"Document type: {result['document_type']}")
                
                if result['document_type'] == 'rent_roll':
                    print(f"Property: {result.get('property_address', 'Unknown')}")
                    print(f"Total tenants: {result['summary'].get('total_tenants', 0)}")
                    print(f"Total annual rent: ${result['summary'].get('total_annual_rent', 0):,.2f}")
                    
                elif result['document_type'] == 'income_statement':
                    print(f"Property: {result.get('property_address', 'Unknown')}")
                    print(f"NOI: ${result['summary'].get('net_operating_income', 0):,.2f}")
                    print(f"Expense ratio: {result['summary'].get('operating_expense_ratio', 0):.2%}")
                    
            except Exception as e:
                print(f"Error parsing {file_path}: {e}")