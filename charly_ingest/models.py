# models.py

from typing import Optional, List, Dict
from datetime import date
from pydantic import BaseModel, Field


class PropertyRecord(BaseModel):
    property_id: str = Field(..., description="Unique property identifier")
    address: str = Field(..., description="Property address")
    parcel_number: Optional[str] = Field(
        None, description="Official parcel/tax lot number"
    )
    jurisdiction: Optional[str] = Field(None, description="Tax jurisdiction or county")

    assessment_value: float = Field(..., gt=0, description="Current assessed value")
    market_value: Optional[float] = Field(None, description="Estimated market value")
    last_sale_price: Optional[float] = Field(None, description="Last sale price")
    last_sale_date: Optional[date] = Field(None, description="Date of last sale")
    assessment_date: Optional[date] = Field(None, description="Date of assessment")

    age: Optional[int] = Field(None, ge=0, description="Building age in years")
    building_size: Optional[float] = Field(None, description="Building size in sq ft")
    lot_size: Optional[float] = Field(None, description="Land parcel size")
    number_of_units: Optional[int] = Field(None, description="Number of rental units")
    property_type: Optional[str] = Field(None, description="Property type")

    gross_income: Optional[float] = Field(None, description="Gross rental income")
    net_operating_income: Optional[float] = Field(None, description="NOI")
    vacancy_rate: Optional[float] = Field(
        None, ge=0, le=1, description="Vacancy rate (0-1)"
    )
    expense_ratio: Optional[float] = Field(
        None, ge=0, le=1, description="Expense ratio (0-1)"
    )
    operating_expenses: Optional[float] = Field(None, description="Operating expenses")
    capital_expenditures: Optional[float] = Field(
        None, description="Capital expenditures"
    )
    lease_type: Optional[str] = Field(None, description="Lease type (e.g., triple-net)")

    cap_rate: Optional[float] = Field(None, description="Capitalization rate")
    comparable_sales: Optional[List[Dict]] = Field(
        None, description="Comparable sales data"
    )
    neighborhood: Optional[str] = Field(None, description="Neighborhood or market area")
    zoning: Optional[str] = Field(None, description="Zoning classification")
    accessibility: Optional[str] = Field(None, description="Accessibility notes")

    condition: Optional[str] = Field(None, description="Property condition")
    depreciation: Optional[float] = Field(None, description="Accumulated depreciation")
    last_renovation_date: Optional[date] = Field(
        None, description="Date of last renovation"
    )

    tax_class: Optional[str] = Field(None, description="Tax class")
    exemptions: Optional[List[str]] = Field(None, description="Tax exemptions")
    appeal_status: Optional[str] = Field(None, description="Appeal status")
    assessment_history: Optional[List[Dict]] = Field(
        None, description="Historical assessment values"
    )

    special_conditions: Optional[str] = Field(
        None, description="Special conditions or notes"
    )
    owner_type: Optional[str] = Field(None, description="Owner type")
    risk_flags: Optional[List[str]] = Field(None, description="Risk flags")


class TenantData(BaseModel):
    """Individual tenant information from rent roll"""
    tenant_name: str = Field(..., description="Tenant business name")
    suite_number: Optional[str] = Field(None, description="Suite or unit number")
    square_footage: float = Field(..., gt=0, description="Leased square footage")
    monthly_rent: float = Field(..., ge=0, description="Monthly base rent")
    annual_rent: float = Field(..., ge=0, description="Annual base rent")
    rent_per_sf: float = Field(..., ge=0, description="Rent per square foot")
    lease_start_date: Optional[date] = Field(None, description="Lease start date")
    lease_end_date: Optional[date] = Field(None, description="Lease expiration date")
    lease_term_months: Optional[int] = Field(None, description="Lease term in months")
    escalations: Optional[str] = Field(None, description="Rent escalation terms")
    tenant_improvements: Optional[float] = Field(None, description="Tenant improvement costs")
    security_deposit: Optional[float] = Field(None, description="Security deposit amount")
    percentage_rent: Optional[float] = Field(None, description="Percentage rent if applicable")
    cam_charges: Optional[float] = Field(None, description="Common area maintenance charges")
    utilities_included: Optional[bool] = Field(None, description="Whether utilities included")
    tenant_type: Optional[str] = Field(None, description="Type of business/tenant")
    
    
class RentRoll(BaseModel):
    """Complete rent roll data for a commercial property"""
    property_id: str = Field(..., description="Associated property identifier")
    as_of_date: date = Field(..., description="Rent roll effective date")
    total_leasable_sf: float = Field(..., gt=0, description="Total leasable square footage")
    occupied_sf: float = Field(..., ge=0, description="Currently occupied square footage")
    vacant_sf: float = Field(..., ge=0, description="Vacant square footage")
    physical_occupancy_rate: float = Field(..., ge=0, le=1, description="Physical occupancy rate")
    economic_occupancy_rate: Optional[float] = Field(None, ge=0, le=1, description="Economic occupancy rate")
    
    tenants: List[TenantData] = Field(..., description="List of all tenants")
    
    # Calculated totals
    total_monthly_rent: float = Field(..., ge=0, description="Total monthly rental income")
    total_annual_rent: float = Field(..., ge=0, description="Total annual rental income")
    average_rent_per_sf: float = Field(..., ge=0, description="Average rent per square foot")
    
    # Additional income streams
    cam_income: Optional[float] = Field(None, description="CAM income annually")
    parking_income: Optional[float] = Field(None, description="Parking income annually")
    other_income: Optional[float] = Field(None, description="Other miscellaneous income")
    
    
class IncomeStatement(BaseModel):
    """Commercial property income statement/operating data"""
    property_id: str = Field(..., description="Associated property identifier")
    period_start: date = Field(..., description="Statement period start")
    period_end: date = Field(..., description="Statement period end")
    
    # Income items
    gross_rental_income: float = Field(..., ge=0, description="Gross rental income")
    vacancy_loss: float = Field(..., ge=0, description="Vacancy and collection losses")
    effective_gross_income: float = Field(..., ge=0, description="Effective gross income")
    other_income: Optional[float] = Field(None, description="Other property income")
    total_income: float = Field(..., ge=0, description="Total property income")
    
    # Operating expenses
    management_fees: Optional[float] = Field(None, description="Property management fees")
    maintenance_repairs: Optional[float] = Field(None, description="Maintenance and repairs")
    utilities: Optional[float] = Field(None, description="Utility expenses")
    insurance: Optional[float] = Field(None, description="Insurance costs")
    property_taxes: Optional[float] = Field(None, description="Property tax expenses")
    professional_fees: Optional[float] = Field(None, description="Legal/accounting fees")
    marketing_leasing: Optional[float] = Field(None, description="Marketing and leasing costs")
    administrative: Optional[float] = Field(None, description="Administrative expenses")
    other_expenses: Optional[float] = Field(None, description="Other operating expenses")
    total_operating_expenses: float = Field(..., ge=0, description="Total operating expenses")
    
    # Key metrics
    net_operating_income: float = Field(..., description="Net Operating Income (NOI)")
    operating_expense_ratio: Optional[float] = Field(None, ge=0, le=1, description="Operating expense ratio")
    
    
class ComparableSale(BaseModel):
    """Comparable sale data for sales comparison approach"""
    comparable_id: str = Field(..., description="Unique comparable identifier")
    address: str = Field(..., description="Property address")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State")
    
    sale_price: float = Field(..., gt=0, description="Sale price")
    sale_date: date = Field(..., description="Date of sale")
    price_per_sf: Optional[float] = Field(None, description="Price per square foot")
    
    # Property characteristics
    building_size: Optional[float] = Field(None, description="Building size in sq ft")
    lot_size: Optional[float] = Field(None, description="Lot size")
    year_built: Optional[int] = Field(None, description="Year built")
    property_type: Optional[str] = Field(None, description="Property type")
    condition: Optional[str] = Field(None, description="Property condition")
    
    # Location and market factors
    distance_to_subject: Optional[float] = Field(None, description="Distance to subject property (miles)")
    market_conditions: Optional[str] = Field(None, description="Market conditions at sale")
    financing_terms: Optional[str] = Field(None, description="Financing terms")
    
    # Adjustments for comparison
    time_adjustment: Optional[float] = Field(None, description="Time/market adjustment")
    location_adjustment: Optional[float] = Field(None, description="Location adjustment")
    size_adjustment: Optional[float] = Field(None, description="Size adjustment")
    condition_adjustment: Optional[float] = Field(None, description="Condition adjustment")
    other_adjustments: Optional[float] = Field(None, description="Other adjustments")
    total_adjustments: Optional[float] = Field(None, description="Total adjustments")
    adjusted_price: Optional[float] = Field(None, description="Adjusted sale price")
    adjusted_price_per_sf: Optional[float] = Field(None, description="Adjusted price per sq ft")


class ValuationWorkup(BaseModel):
    """Complete IAAO-compliant valuation analysis"""
    property_id: str = Field(..., description="Subject property identifier")
    valuation_date: date = Field(..., description="Effective date of valuation")
    appraiser_name: Optional[str] = Field(None, description="Appraiser name")
    
    # Property summary
    subject_address: str = Field(..., description="Subject property address")
    property_type: str = Field(..., description="Property type")
    building_size: Optional[float] = Field(None, description="Building size in sq ft")
    land_size: Optional[float] = Field(None, description="Land size")
    year_built: Optional[int] = Field(None, description="Year built")
    
    # Sales Comparison Approach
    sales_approach_applicable: bool = Field(True, description="Whether sales approach is applicable")
    comparable_sales: Optional[List[ComparableSale]] = Field(None, description="Comparable sales data")
    sales_approach_value: Optional[float] = Field(None, description="Value indication from sales approach")
    sales_approach_weight: Optional[float] = Field(None, ge=0, le=100, description="Weight assigned to sales approach")
    
    # Cost Approach  
    cost_approach_applicable: bool = Field(True, description="Whether cost approach is applicable")
    land_value: Optional[float] = Field(None, description="Land value estimate")
    replacement_cost_new: Optional[float] = Field(None, description="Replacement cost new")
    reproduction_cost_new: Optional[float] = Field(None, description="Reproduction cost new")
    physical_depreciation: Optional[float] = Field(None, description="Physical depreciation")
    functional_obsolescence: Optional[float] = Field(None, description="Functional obsolescence")
    external_obsolescence: Optional[float] = Field(None, description="External obsolescence")
    total_depreciation: Optional[float] = Field(None, description="Total depreciation")
    cost_approach_value: Optional[float] = Field(None, description="Value indication from cost approach")
    cost_approach_weight: Optional[float] = Field(None, ge=0, le=100, description="Weight assigned to cost approach")
    
    # Income Approach
    income_approach_applicable: bool = Field(True, description="Whether income approach is applicable")
    annual_gross_income: Optional[float] = Field(None, description="Annual gross income")
    vacancy_collection_loss: Optional[float] = Field(None, description="Vacancy and collection loss")
    effective_gross_income: Optional[float] = Field(None, description="Effective gross income")
    operating_expenses: Optional[float] = Field(None, description="Total operating expenses")
    net_operating_income: Optional[float] = Field(None, description="Net Operating Income")
    capitalization_rate: Optional[float] = Field(None, description="Capitalization rate")
    income_approach_value: Optional[float] = Field(None, description="Value indication from income approach")
    income_approach_weight: Optional[float] = Field(None, ge=0, le=100, description="Weight assigned to income approach")
    
    # Final value reconciliation
    final_value_estimate: Optional[float] = Field(None, description="Final reconciled value estimate")
    confidence_level: Optional[float] = Field(None, ge=0, le=100, description="Confidence level of estimate")
    
    # Current assessment comparison
    current_assessed_value: Optional[float] = Field(None, description="Current assessed value")
    proposed_assessed_value: Optional[float] = Field(None, description="Proposed assessed value")
    potential_tax_savings: Optional[float] = Field(None, description="Potential annual tax savings")
    
    # Supporting documentation
    supporting_documents: Optional[List[str]] = Field(None, description="List of supporting document paths")
    valuation_notes: Optional[str] = Field(None, description="Additional valuation notes")
    iaao_compliance_notes: Optional[str] = Field(None, description="IAAO compliance documentation")
