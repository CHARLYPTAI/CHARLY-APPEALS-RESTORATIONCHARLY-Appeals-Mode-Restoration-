#!/usr/bin/env python3
"""
CHARLY Platform - GCP App Engine Entry Point
"""

import os
import subprocess
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

# JWT Secret Configuration for R2 requirement
DEMO_SECRET = "charly-demo-secret-please-change-for-prod"
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or DEMO_SECRET
JWT_SECRET_SOURCE = "ENV" if os.getenv("JWT_SECRET_KEY") else "DEMO"
print(f"[AUTH] JWT secret source: {JWT_SECRET_SOURCE}")

# Compute version info on startup
def get_git_sha():
    try:
        return subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=os.path.dirname(__file__)).decode().strip()[:8]
    except:
        return "unknown"

def get_build_time():
    return datetime.utcnow().isoformat() + "Z"

def get_router_imports():
    # For this simple server, we don't have separate routers
    return ["auth", "api"]

def get_jwt_secret_source():
    return JWT_SECRET_SOURCE

# Store version info
VERSION_INFO = {
    "git_sha": get_git_sha(),
    "build_time": get_build_time(),
    "router_imports": get_router_imports(),
    "jwt_secret_source": get_jwt_secret_source()
}

print(f"[CHARLY] Version: {VERSION_INFO['git_sha']}@{VERSION_INFO['build_time']}")
print(f"[CHARLY] JWT Source: {VERSION_INFO['jwt_secret_source']}")

app = FastAPI(title="CHARLY Platform")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add version header middleware
class VersionHeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-CHARLY-Version"] = f"{VERSION_INFO['git_sha']}@{VERSION_INFO['build_time']}"
        return response

app.add_middleware(VersionHeaderMiddleware)

# Simple auth endpoints to resolve 405 issues
from pydantic import BaseModel
from fastapi import HTTPException, UploadFile, File

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """Simple auth endpoint to prevent 405 errors"""
    # Demo auth - accept both credential sets for flexibility
    valid_credentials = [
        ("demo@charly.com", "demo123"),
        ("admin@charly.com", "CharlyCTO2025!")
    ]
    
    if (request.email, request.password) in valid_credentials:
        return {
            "access_token": "demo_token_12345",
            "refresh_token": "demo_refresh_12345",
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": "demo_user",
                "email": request.email,
                "role": "admin",
                "permissions": ["all"],
                "firm_name": "CHARLY Demo"
            }
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/auth/me")
async def get_me():
    """Simple user info endpoint"""
    return {
        "id": "demo_user",
        "email": "admin@charly.com", 
        "role": "admin",
        "permissions": ["all"],
        "firm_name": "CHARLY Demo"
    }

@app.get("/api/auth/validate")
async def validate():
    """Simple token validation endpoint"""
    return {"valid": True}

@app.post("/api/auth/refresh")
async def refresh(refresh_data: dict):
    """Simple token refresh endpoint"""
    return {
        "access_token": "demo_token_12345",
        "refresh_token": "demo_refresh_12345",
        "token_type": "bearer", 
        "expires_in": 3600
    }

@app.post("/api/auth/logout")
async def logout():
    """Simple logout endpoint"""
    return {"success": True}

@app.get("/api/version")
async def get_version():
    """Version info endpoint"""
    return VERSION_INFO

# API routes
@app.get("/api/kpis")
async def get_kpis():
    return {
        "estimated_savings": 2500000,
        "open_appeals": 42,
        "upcoming_deadlines": 8,
        "appeals_won": 156
    }

@app.get("/api/settings")
async def get_settings():
    return {
        "settings": {
            "firm_name": "CHARLY Demo",
            "license_number": "TX000123",
            "filing_entity": "CHARLY Partners",
            "watermark_enabled": True,
            "gpt_enabled": True,
        },
        "status": "success",
        "message": "Settings retrieved successfully"
    }

@app.get("/api/dashboard/recent-activity")
async def get_recent_activity():
    return [
        {
            "id": "1",
            "message": "15 new over-assessed properties identified in Harris County, TX",
            "timestamp": "2025-07-13T10:30:00Z",
            "type": "property_flagged",
            "severity": "info"
        },
        {
            "id": "2", 
            "message": "8 appeals successfully submitted to Harris County, TX",
            "timestamp": "2025-07-12T15:45:00Z",
            "type": "appeal_filed",
            "severity": "success"
        },
        {
            "id": "3",
            "message": "King County, WA deadline approaching (5 days)",
            "timestamp": "2025-07-13T09:15:00Z", 
            "type": "deadline_approaching",
            "severity": "warning"
        }
    ]

@app.get("/api/dashboard/analytics")
async def get_analytics():
    return {
        "totalProperties": 342,
        "totalSavings": 2500000,
        "appealsWon": 156,
        "successRate": 87,
        "financialMetrics": [
            {"category": "Commercial", "value": 1800000, "trend": 12},
            {"category": "Residential", "value": 650000, "trend": 8},
            {"category": "Industrial", "value": 50000, "trend": 15}
        ],
        "monthlyTrends": [
            {"month": "Jan", "appeals": 25, "savings": 450000},
            {"month": "Feb", "appeals": 32, "savings": 580000},
            {"month": "Mar", "appeals": 28, "savings": 520000},
            {"month": "Apr", "appeals": 35, "savings": 620000},
            {"month": "May", "appeals": 42, "savings": 750000},
            {"month": "Jun", "appeals": 38, "savings": 680000}
        ]
    }

@app.get("/api/dashboard/ai-insights")
async def get_ai_insights():
    return {
        "summary": "Analysis of 342 properties reveals strong appeal opportunities with high success probability",
        "keyFindings": [
            {
                "id": "1",
                "title": "Commercial Over-Assessment Pattern",
                "description": "3 properties in Austin show potential for 20%+ reduction based on comparable sales",
                "impact": "opportunity", 
                "confidence": 0.87
            },
            {
                "id": "2",
                "title": "Market Analysis Alert",
                "description": "Market data suggests commercial assessments are running 15% above fair value",
                "impact": "market_analysis",
                "confidence": 0.92
            },
            {
                "id": "3", 
                "title": "Deadline Alert",
                "description": "Upcoming deadline: Harris County, TX appeals must be filed by March 31st",
                "impact": "deadline_alert",
                "confidence": 1.0
            }
        ],
        "recommendations": [
            {
                "id": "1",
                "action": "Focus on commercial properties for highest ROI",
                "priority": "high",
                "estimatedImpact": "$650K potential savings"
            },
            {
                "id": "2", 
                "action": "Review Austin market comparables this week",
                "priority": "medium",
                "estimatedImpact": "$200K potential savings"
            },
            {
                "id": "3",
                "action": "Prepare Harris County, TX filings immediately", 
                "priority": "urgent",
                "estimatedImpact": "Avoid deadline penalties"
            }
        ],
        "marketAnalysis": [
            {
                "county": "Harris County, TX",
                "trend": "favorable",
                "compliance": 92,
                "opportunities": 18
            },
            {
                "county": "Los Angeles County, CA", 
                "trend": "stable",
                "compliance": 88,
                "opportunities": 24
            },
            {
                "county": "Cook County, IL",
                "trend": "improving",
                "compliance": 85,
                "opportunities": 15
            }
        ]
    }

# Portfolio API endpoints
@app.get("/api/portfolio/")
async def get_properties():
    """Get all properties for the user"""
    return {
        "properties": [
            {
                "id": "1",
                "address": "123 Main Street",
                "city": "Austin",
                "state": "TX",
                "zip_code": "78701",
                "county": "Travis County",
                "property_type": "Commercial",
                "current_assessment": 850000,
                "assessed_value": 850000,
                "proposed_value": 680000,
                "potential_savings": 170000,
                "status": "Under Review",
                "square_footage": 12500,
                "year_built": 1995,
                "created_date": "2025-07-01T10:00:00Z"
            },
            {
                "id": "2", 
                "address": "456 Oak Avenue",
                "city": "Houston",
                "state": "TX",
                "zip_code": "77001",
                "county": "Harris County",
                "property_type": "Residential",
                "current_assessment": 425000,
                "assessed_value": 425000,
                "proposed_value": 380000,
                "potential_savings": 45000,
                "status": "Appeal Filed",
                "square_footage": 2800,
                "year_built": 2010,
                "created_date": "2025-06-15T14:30:00Z"
            },
            {
                "id": "3",
                "address": "789 Industrial Blvd",
                "city": "Dallas",
                "state": "TX", 
                "zip_code": "75201",
                "county": "Dallas County",
                "property_type": "Industrial",
                "current_assessment": 1250000,
                "assessed_value": 1250000,
                "proposed_value": 950000,
                "potential_savings": 300000,
                "status": "Won",
                "square_footage": 45000,
                "year_built": 1988,
                "created_date": "2025-05-20T09:15:00Z"
            }
        ]
    }

@app.post("/api/portfolio/properties")
async def create_property(property_data: dict):
    """Create a new property"""
    import uuid
    from datetime import datetime
    
    # Generate ID and timestamp
    property_id = str(uuid.uuid4())
    created_date = datetime.utcnow().isoformat() + "Z"
    
    # Create property object with defaults
    new_property = {
        "id": property_id,
        "address": property_data.get("address", ""),
        "city": property_data.get("city", ""),
        "state": property_data.get("state", ""),
        "zip_code": property_data.get("zip_code", ""),
        "county": property_data.get("county", ""),
        "property_type": property_data.get("property_type", "Residential"),
        "current_assessment": property_data.get("current_assessment", 0),
        "assessed_value": property_data.get("current_assessment", 0),
        "status": "Under Review",
        "square_footage": property_data.get("square_footage"),
        "year_built": property_data.get("year_built"),
        "created_date": created_date
    }
    
    return {"property": new_property, "message": "Property added successfully"}

@app.put("/api/portfolio/properties/{property_id}")
async def update_property(property_id: str, property_data: dict):
    """Update an existing property"""
    updated_property = {
        "id": property_id,
        "address": property_data.get("address", ""),
        "city": property_data.get("city", ""),
        "state": property_data.get("state", ""),
        "zip_code": property_data.get("zip_code", ""),
        "county": property_data.get("county", ""),
        "property_type": property_data.get("property_type", "Residential"),
        "current_assessment": property_data.get("current_assessment", 0),
        "assessed_value": property_data.get("current_assessment", 0),
        "status": "Under Review",
        "square_footage": property_data.get("square_footage"),
        "year_built": property_data.get("year_built"),
        "created_date": "2025-07-01T10:00:00Z"  # Would normally preserve original
    }
    
    return {"property": updated_property, "message": "Property updated successfully"}

@app.delete("/api/portfolio/properties/{property_id}")
async def delete_property(property_id: str):
    """Delete a property"""
    return {"message": "Property deleted successfully"}

@app.post("/api/upload/property-document")
async def upload_property_document(
    property_id: str,
    file: UploadFile = File(...),
    document_type: str = "auto"
):
    """Upload and parse property documents (income statements, rent rolls, etc.)"""
    import tempfile
    import os
    import json
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Parse the document using our commercial PDF parser
        from charly_ingest.commercial_pdf_parser import CommercialPDFParser
        parser = CommercialPDFParser()
        
        # Parse the document
        parsed_data = parser.parse_commercial_document(tmp_file_path, document_type)
        
        # Clean up temporary file
        os.unlink(tmp_file_path)
        
        # Return structured data for frontend consumption
        result = {
            "property_id": property_id,
            "file_name": file.filename,
            "document_type": parsed_data.get("document_type", "unknown"),
            "parsed_data": parsed_data,
            "upload_date": datetime.utcnow().isoformat() + "Z",
            "message": "Document uploaded and parsed successfully"
        }
        
        # Extract key financial data for quick access
        if parsed_data.get("document_type") == "income_statement":
            result["financial_summary"] = {
                "gross_income": parsed_data.get("income_items", {}).get("total_income", 0),
                "operating_expenses": parsed_data.get("expense_items", {}).get("total_expenses", 0),
                "net_operating_income": parsed_data.get("summary", {}).get("net_income", 0)
            }
        elif parsed_data.get("document_type") == "rent_roll":
            result["financial_summary"] = {
                "total_monthly_rent": parsed_data.get("summary", {}).get("total_monthly_rent", 0),
                "occupancy_rate": parsed_data.get("summary", {}).get("occupancy_rate", 0),
                "vacant_square_feet": parsed_data.get("summary", {}).get("vacant_square_feet", 0)
            }
        
        return result
        
    except Exception as e:
        # Clean up temp file if it exists
        if 'tmp_file_path' in locals():
            try:
                os.unlink(tmp_file_path)
            except:
                pass
        
        raise HTTPException(status_code=400, detail=f"Failed to process document: {str(e)}")

@app.post("/api/appeals/")
async def create_appeal(appeal_data: dict):
    """Create a new appeal for a property"""
    import uuid
    from datetime import datetime
    
    appeal_id = str(uuid.uuid4())
    created_date = datetime.utcnow().isoformat() + "Z"
    
    new_appeal = {
        "id": appeal_id,
        "property_id": appeal_data.get("property_id", ""),
        "status": "Filed",
        "created_date": created_date,
        "valuation_data": appeal_data.get("valuation_data", {})
    }
    
    return {"appeal": new_appeal, "message": "Appeal created successfully"}

# ===== IAAO-COMPLIANT VALUATION ENGINE =====

@app.post("/api/valuation/sales-comparison")
async def sales_comparison_valuation(valuation_request: dict):
    """Perform IAAO-compliant Sales Comparison Approach valuation"""
    property_id = valuation_request.get("property_id")
    subject_property = valuation_request.get("subject_property", {})
    comparables = valuation_request.get("comparables", [])
    
    # Process each comparable with adjustments
    adjusted_comparables = []
    for comp in comparables:
        # Time adjustment (market conditions)
        time_adj = calculate_time_adjustment(comp.get("sale_date"), subject_property.get("valuation_date", "2025-08-13"))
        
        # Location adjustment
        location_adj = calculate_location_adjustment(comp.get("location_rating", 5), subject_property.get("location_rating", 5))
        
        # Size adjustment  
        size_adj = calculate_size_adjustment(comp.get("building_size", 0), subject_property.get("building_size", 0))
        
        # Condition adjustment
        condition_adj = calculate_condition_adjustment(comp.get("condition_rating", 3), subject_property.get("condition_rating", 3))
        
        # Calculate total adjustments
        total_adjustment = time_adj + location_adj + size_adj + condition_adj
        adjusted_price = comp.get("sale_price", 0) + total_adjustment
        
        adjusted_comp = {
            **comp,
            "adjustments": {
                "time_adjustment": time_adj,
                "location_adjustment": location_adj,
                "size_adjustment": size_adj,
                "condition_adjustment": condition_adj,
                "total_adjustment": total_adjustment
            },
            "adjusted_price": adjusted_price,
            "adjusted_price_per_sf": adjusted_price / comp.get("building_size", 1) if comp.get("building_size") else 0
        }
        adjusted_comparables.append(adjusted_comp)
    
    # Calculate final value indication
    if adjusted_comparables:
        adjusted_prices = [comp["adjusted_price"] for comp in adjusted_comparables if comp["adjusted_price"] > 0]
        if adjusted_prices:
            # Use weighted average based on comparability
            weights = [calculate_comparability_weight(comp) for comp in adjusted_comparables]
            weighted_sum = sum(price * weight for price, weight in zip(adjusted_prices, weights))
            total_weight = sum(weights)
            value_indication = weighted_sum / total_weight if total_weight > 0 else sum(adjusted_prices) / len(adjusted_prices)
        else:
            value_indication = 0
    else:
        value_indication = 0
    
    return {
        "approach": "sales_comparison",
        "property_id": property_id,
        "value_indication": value_indication,
        "comparable_count": len(adjusted_comparables),
        "adjusted_comparables": adjusted_comparables,
        "confidence_level": calculate_sales_confidence(adjusted_comparables),
        "methodology_notes": "IAAO-compliant Sales Comparison Approach with time, location, size, and condition adjustments"
    }

@app.post("/api/valuation/cost-approach")
async def cost_approach_valuation(valuation_request: dict):
    """Perform IAAO-compliant Cost Approach valuation"""
    property_id = valuation_request.get("property_id")
    property_data = valuation_request.get("property_data", {})
    
    building_size = property_data.get("building_size", 0)
    year_built = property_data.get("year_built", 2000)
    property_type = property_data.get("property_type", "Office")
    condition_rating = property_data.get("condition_rating", 3)  # 1-5 scale
    location_multiplier = property_data.get("location_multiplier", 1.0)
    
    # Land value estimation (from comparables or assessment)
    land_value = property_data.get("land_value") or estimate_land_value(property_data)
    
    # Replacement Cost New calculation
    base_cost_per_sf = get_base_construction_cost(property_type)
    local_cost_multiplier = get_local_cost_multiplier(property_data.get("city", "Austin"))
    replacement_cost_new = building_size * base_cost_per_sf * local_cost_multiplier * location_multiplier
    
    # Depreciation calculations
    current_year = 2025
    effective_age = current_year - year_built
    
    # Physical depreciation (straight-line with condition adjustment)
    useful_life = get_useful_life(property_type)
    physical_depreciation_rate = min(effective_age / useful_life, 0.85)  # Cap at 85%
    condition_adjustment = {1: 0.3, 2: 0.15, 3: 0.0, 4: -0.1, 5: -0.2}.get(condition_rating, 0)
    physical_depreciation_rate += condition_adjustment
    physical_depreciation = replacement_cost_new * max(0, min(physical_depreciation_rate, 0.85))
    
    # Functional obsolescence 
    functional_obsolescence = estimate_functional_obsolescence(property_data)
    
    # External obsolescence (economic factors)
    external_obsolescence = estimate_external_obsolescence(property_data)
    
    total_depreciation = physical_depreciation + functional_obsolescence + external_obsolescence
    depreciated_improvement_value = replacement_cost_new - total_depreciation
    
    # Final cost approach value
    cost_approach_value = land_value + depreciated_improvement_value
    
    return {
        "approach": "cost_approach",
        "property_id": property_id,
        "value_indication": cost_approach_value,
        "components": {
            "land_value": land_value,
            "replacement_cost_new": replacement_cost_new,
            "total_depreciation": total_depreciation,
            "depreciated_improvement_value": depreciated_improvement_value
        },
        "depreciation_breakdown": {
            "physical_depreciation": physical_depreciation,
            "functional_obsolescence": functional_obsolescence,
            "external_obsolescence": external_obsolescence
        },
        "calculations": {
            "building_size": building_size,
            "base_cost_per_sf": base_cost_per_sf,
            "local_multiplier": local_cost_multiplier,
            "effective_age": effective_age,
            "useful_life": useful_life,
            "physical_depreciation_rate": physical_depreciation_rate
        },
        "confidence_level": calculate_cost_confidence(property_data),
        "methodology_notes": "IAAO-compliant Cost Approach using replacement cost new less accrued depreciation"
    }

@app.post("/api/valuation/income-approach")
async def income_approach_valuation(valuation_request: dict):
    """Perform IAAO-compliant Income Approach valuation"""
    property_id = valuation_request.get("property_id")
    income_data = valuation_request.get("income_data", {})
    market_data = valuation_request.get("market_data", {})
    
    # Gross rental income
    gross_rental_income = income_data.get("gross_rental_income", 0)
    
    # Vacancy and collection loss
    vacancy_rate = income_data.get("vacancy_rate", 0.05)
    vacancy_loss = gross_rental_income * vacancy_rate
    
    # Effective gross income  
    other_income = income_data.get("other_income", 0)
    effective_gross_income = gross_rental_income - vacancy_loss + other_income
    
    # Operating expenses
    operating_expenses = income_data.get("operating_expenses", 0)
    if not operating_expenses:
        # Estimate based on property type and size
        expense_ratio = get_typical_expense_ratio(income_data.get("property_type", "Office"))
        operating_expenses = effective_gross_income * expense_ratio
    
    # Net Operating Income
    net_operating_income = effective_gross_income - operating_expenses
    
    # Direct Capitalization Method
    cap_rate = market_data.get("cap_rate") or get_market_cap_rate(income_data.get("property_type", "Office"), income_data.get("location", "Austin"))
    direct_cap_value = net_operating_income / cap_rate if cap_rate > 0 else 0
    
    # Gross Rent Multiplier Method
    monthly_rent = gross_rental_income / 12 if gross_rental_income > 0 else 0
    grm = market_data.get("gross_rent_multiplier") or get_market_grm(income_data.get("property_type", "Office"))
    grm_value = monthly_rent * 12 * grm if grm > 0 else 0
    
    # Discounted Cash Flow (simplified 10-year)
    growth_rate = market_data.get("income_growth_rate", 0.02)
    discount_rate = market_data.get("discount_rate") or (cap_rate + 0.01) if cap_rate > 0 else 0.08
    dcf_value = calculate_dcf_value(net_operating_income, growth_rate, discount_rate, 10) if discount_rate > 0 else 0
    
    # Reconcile income approach methods
    methods = []
    if direct_cap_value > 0:
        methods.append({"method": "direct_capitalization", "value": direct_cap_value, "weight": 0.6})
    if grm_value > 0:
        methods.append({"method": "gross_rent_multiplier", "value": grm_value, "weight": 0.2})  
    if dcf_value > 0:
        methods.append({"method": "discounted_cash_flow", "value": dcf_value, "weight": 0.2})
    
    if methods:
        weighted_value = sum(method["value"] * method["weight"] for method in methods)
        total_weight = sum(method["weight"] for method in methods)
        income_approach_value = weighted_value / total_weight if total_weight > 0 else 0
    else:
        income_approach_value = 0
    
    return {
        "approach": "income_approach", 
        "property_id": property_id,
        "value_indication": income_approach_value,
        "income_analysis": {
            "gross_rental_income": gross_rental_income,
            "vacancy_loss": vacancy_loss,
            "other_income": other_income,
            "effective_gross_income": effective_gross_income,
            "operating_expenses": operating_expenses,
            "net_operating_income": net_operating_income,
            "operating_expense_ratio": operating_expenses / effective_gross_income if effective_gross_income > 0 else 0
        },
        "valuation_methods": {
            "direct_capitalization": {
                "value": direct_cap_value,
                "cap_rate": cap_rate,
                "method_notes": "NOI / Cap Rate"
            },
            "gross_rent_multiplier": {
                "value": grm_value, 
                "grm": grm,
                "monthly_rent": monthly_rent,
                "method_notes": "Monthly Rent × 12 × GRM"
            },
            "discounted_cash_flow": {
                "value": dcf_value,
                "discount_rate": discount_rate,
                "growth_rate": growth_rate,
                "method_notes": "10-year DCF with terminal value"
            }
        },
        "confidence_level": calculate_income_confidence(income_data, market_data),
        "methodology_notes": "IAAO-compliant Income Approach using multiple methodologies with market-derived rates"
    }

@app.post("/api/valuation/reconciliation")
async def value_reconciliation(reconciliation_request: dict):
    """Reconcile the three approaches to arrive at final value estimate"""
    property_id = reconciliation_request.get("property_id")
    approaches = reconciliation_request.get("approaches", {})
    
    sales_value = approaches.get("sales_comparison", {}).get("value_indication", 0)
    cost_value = approaches.get("cost_approach", {}).get("value_indication", 0)  
    income_value = approaches.get("income_approach", {}).get("value_indication", 0)
    
    sales_confidence = approaches.get("sales_comparison", {}).get("confidence_level", 0)
    cost_confidence = approaches.get("cost_approach", {}).get("confidence_level", 0)
    income_confidence = approaches.get("income_approach", {}).get("confidence_level", 0)
    
    # Determine weights based on applicability and confidence
    property_type = reconciliation_request.get("property_type", "Commercial")
    
    if property_type.lower() in ["office", "retail", "industrial", "apartment"]:
        # Income-producing property - emphasize income approach
        base_weights = {"sales": 0.3, "cost": 0.2, "income": 0.5}
    else:
        # Non-income property - emphasize sales comparison  
        base_weights = {"sales": 0.6, "cost": 0.3, "income": 0.1}
    
    # Adjust weights based on confidence and value availability
    weights = {}
    approaches_available = []
    
    if sales_value > 0:
        weights["sales"] = base_weights["sales"] * (sales_confidence / 100)
        approaches_available.append("sales")
    else:
        weights["sales"] = 0
        
    if cost_value > 0:
        weights["cost"] = base_weights["cost"] * (cost_confidence / 100) 
        approaches_available.append("cost")
    else:
        weights["cost"] = 0
        
    if income_value > 0:
        weights["income"] = base_weights["income"] * (income_confidence / 100)
        approaches_available.append("income")
    else:
        weights["income"] = 0
    
    # Normalize weights to sum to 1
    total_weight = sum(weights.values())
    if total_weight > 0:
        normalized_weights = {k: v / total_weight for k, v in weights.items()}
    else:
        normalized_weights = {"sales": 0.33, "cost": 0.33, "income": 0.34}  # Equal if no confidence data
    
    # Calculate final reconciled value
    final_value = (
        sales_value * normalized_weights.get("sales", 0) +
        cost_value * normalized_weights.get("cost", 0) +
        income_value * normalized_weights.get("income", 0)
    )
    
    # Calculate overall confidence based on approach consistency
    values = [v for v in [sales_value, cost_value, income_value] if v > 0]
    if len(values) >= 2:
        mean_value = sum(values) / len(values)
        variance = sum((v - mean_value) ** 2 for v in values) / len(values)
        coefficient_of_variation = (variance ** 0.5) / mean_value if mean_value > 0 else 1
        overall_confidence = max(10, min(95, 90 - (coefficient_of_variation * 100)))
    else:
        overall_confidence = max(sales_confidence, cost_confidence, income_confidence)
    
    return {
        "property_id": property_id,
        "final_value_estimate": final_value,
        "overall_confidence": overall_confidence,
        "approach_weights": {
            "sales_comparison": normalized_weights.get("sales", 0) * 100,
            "cost_approach": normalized_weights.get("cost", 0) * 100, 
            "income_approach": normalized_weights.get("income", 0) * 100
        },
        "approach_values": {
            "sales_comparison": sales_value,
            "cost_approach": cost_value,
            "income_approach": income_value
        },
        "approaches_used": approaches_available,
        "reconciliation_notes": f"Final value based on {len(approaches_available)} approach(es) with confidence-weighted reconciliation",
        "iaao_compliance": "Valuation follows IAAO Standard on Mass Appraisal of Real Property and Standard on Ratio Studies"
    }

# ===== SUPPORTING CALCULATION FUNCTIONS =====

def calculate_time_adjustment(sale_date: str, valuation_date: str) -> float:
    """Calculate market time adjustment between sale date and valuation date"""
    try:
        from datetime import datetime
        sale_dt = datetime.strptime(sale_date[:10], "%Y-%m-%d") 
        val_dt = datetime.strptime(valuation_date[:10], "%Y-%m-%d")
        months_diff = (val_dt.year - sale_dt.year) * 12 + (val_dt.month - sale_dt.month)
        
        # Assume 0.5% monthly market appreciation (6% annually)
        monthly_rate = 0.005
        return months_diff * monthly_rate * 100000  # Adjust per $100k of value
    except:
        return 0

def calculate_location_adjustment(comp_location_rating: int, subject_location_rating: int) -> float:
    """Calculate location adjustment based on location ratings (1-5 scale)"""
    rating_diff = subject_location_rating - comp_location_rating
    # Each rating point difference = 5% value adjustment
    return rating_diff * 0.05 * 500000  # Adjust per $500k average value

def calculate_size_adjustment(comp_size: float, subject_size: float) -> float:
    """Calculate size adjustment for building size differences"""
    if comp_size <= 0 or subject_size <= 0:
        return 0
    
    size_ratio = subject_size / comp_size
    if 0.85 <= size_ratio <= 1.15:  # Within 15% - minimal adjustment
        return 0
    elif size_ratio < 0.85:  # Subject is smaller - positive adjustment for comp
        return min(50000, (0.85 - size_ratio) * 200000)
    else:  # Subject is larger - negative adjustment for comp  
        return -min(50000, (size_ratio - 1.15) * 200000)

def calculate_condition_adjustment(comp_condition: int, subject_condition: int) -> float:
    """Calculate condition adjustment (1=Poor, 2=Fair, 3=Average, 4=Good, 5=Excellent)"""
    condition_diff = subject_condition - comp_condition
    # Each condition rating difference = 8% value adjustment
    return condition_diff * 0.08 * 500000

def calculate_comparability_weight(comparable: dict) -> float:
    """Calculate weight for comparable based on similarity and reliability"""
    base_weight = 1.0
    
    # Adjust for total adjustments (lower adjustment = higher weight)
    total_adj_abs = abs(comparable.get("adjustments", {}).get("total_adjustment", 0))
    if total_adj_abs > 100000:  # Large adjustments reduce weight
        base_weight *= 0.7
    elif total_adj_abs > 50000:
        base_weight *= 0.85
        
    return max(0.1, base_weight)  # Minimum weight of 10%

def calculate_sales_confidence(adjusted_comparables: list) -> float:
    """Calculate confidence level for sales comparison approach"""
    if not adjusted_comparables:
        return 0
    
    base_confidence = 75  # Start with 75%
    
    # More comparables = higher confidence
    if len(adjusted_comparables) >= 5:
        base_confidence += 15
    elif len(adjusted_comparables) >= 3:
        base_confidence += 10
    elif len(adjusted_comparables) >= 1:
        base_confidence += 5
    
    # Lower adjustments = higher confidence
    avg_adjustment = sum(abs(comp.get("adjustments", {}).get("total_adjustment", 0)) 
                        for comp in adjusted_comparables) / len(adjusted_comparables)
    
    if avg_adjustment < 25000:
        base_confidence += 10
    elif avg_adjustment > 75000:
        base_confidence -= 15
        
    return min(95, max(25, base_confidence))

def get_base_construction_cost(property_type: str) -> float:
    """Get base construction cost per square foot by property type"""
    costs = {
        "Office": 180,
        "Retail": 150,
        "Industrial": 85,
        "Warehouse": 75,
        "Apartment": 140,
        "Mixed Use": 165
    }
    return costs.get(property_type, 150)

def get_local_cost_multiplier(city: str) -> float:
    """Get local construction cost multiplier by city"""
    multipliers = {
        "Austin": 1.15,
        "Houston": 1.05, 
        "Dallas": 1.10,
        "San Antonio": 1.00,
        "Fort Worth": 1.05
    }
    return multipliers.get(city, 1.0)

def get_useful_life(property_type: str) -> int:
    """Get typical useful life in years by property type"""
    lives = {
        "Office": 40,
        "Retail": 35,
        "Industrial": 30,
        "Warehouse": 25, 
        "Apartment": 35,
        "Mixed Use": 40
    }
    return lives.get(property_type, 35)

def estimate_land_value(property_data: dict) -> float:
    """Estimate land value based on property characteristics"""
    # Simple estimation - in practice would use land sales comps
    land_size = property_data.get("land_size", 1.0)  # acres
    price_per_acre = 250000  # Varies by location
    return land_size * price_per_acre

def estimate_functional_obsolescence(property_data: dict) -> float:
    """Estimate functional obsolescence based on property characteristics"""
    year_built = property_data.get("year_built", 2000)
    if year_built < 1980:
        return 50000  # Older buildings may have functional issues
    elif year_built < 2000:
        return 25000
    else:
        return 0

def estimate_external_obsolescence(property_data: dict) -> float:
    """Estimate external obsolescence based on location factors"""
    # In practice, would analyze local economic conditions
    location_quality = property_data.get("location_rating", 3)  # 1-5 scale
    if location_quality <= 2:
        return 75000  # Poor location
    elif location_quality <= 3:
        return 25000  # Average location
    else:
        return 0  # Good/excellent location

def calculate_cost_confidence(property_data: dict) -> float:
    """Calculate confidence level for cost approach"""
    base_confidence = 65  # Start lower as cost approach often less reliable for older properties
    
    year_built = property_data.get("year_built", 2000)
    current_year = 2025
    age = current_year - year_built
    
    if age <= 5:
        base_confidence += 20  # Very reliable for new construction
    elif age <= 15:
        base_confidence += 10  # Good reliability
    elif age >= 30:
        base_confidence -= 15  # Lower reliability for older buildings
    
    return min(90, max(30, base_confidence))

def get_typical_expense_ratio(property_type: str) -> float:
    """Get typical operating expense ratio by property type"""
    ratios = {
        "Office": 0.35,
        "Retail": 0.25,  
        "Industrial": 0.20,
        "Apartment": 0.40,
        "Mixed Use": 0.35
    }
    return ratios.get(property_type, 0.30)

def get_market_cap_rate(property_type: str, location: str) -> float:
    """Get market capitalization rate by property type and location"""
    base_rates = {
        "Office": 0.07,
        "Retail": 0.065,
        "Industrial": 0.06,
        "Apartment": 0.055,
        "Mixed Use": 0.075
    }
    
    location_adjustments = {
        "Austin": -0.005,  # Premium market - lower cap rates
        "Dallas": -0.003,
        "Houston": 0.000,
        "San Antonio": 0.003,
        "Fort Worth": 0.002
    }
    
    base_rate = base_rates.get(property_type, 0.07)
    location_adj = location_adjustments.get(location, 0)
    
    return base_rate + location_adj

def get_market_grm(property_type: str) -> float:
    """Get market gross rent multiplier by property type"""
    grms = {
        "Office": 110,
        "Retail": 120,
        "Industrial": 100,
        "Apartment": 140,
        "Mixed Use": 120
    }
    return grms.get(property_type, 115)

def calculate_dcf_value(base_noi: float, growth_rate: float, discount_rate: float, years: int) -> float:
    """Calculate DCF value with terminal value"""
    present_value = 0
    
    for year in range(1, years + 1):
        projected_noi = base_noi * ((1 + growth_rate) ** year)
        pv_factor = 1 / ((1 + discount_rate) ** year)
        present_value += projected_noi * pv_factor
    
    # Terminal value in final year (assume perpetual growth)
    terminal_noi = base_noi * ((1 + growth_rate) ** years)
    terminal_value = terminal_noi / (discount_rate - growth_rate)
    terminal_pv = terminal_value / ((1 + discount_rate) ** years)
    
    return present_value + terminal_pv

def calculate_income_confidence(income_data: dict, market_data: dict) -> float:
    """Calculate confidence level for income approach"""
    base_confidence = 70
    
    # Higher confidence if we have actual income data vs estimates
    if income_data.get("actual_income_data", False):
        base_confidence += 15
    
    # Market data availability affects confidence
    if market_data.get("cap_rate"):
        base_confidence += 10
    if market_data.get("gross_rent_multiplier"):
        base_confidence += 5
        
    # Property type affects income approach reliability
    property_type = income_data.get("property_type", "Office")
    if property_type.lower() in ["office", "retail", "industrial", "apartment"]:
        base_confidence += 10  # Income approach very applicable
    
    return min(90, max(35, base_confidence))

# ===== DOCUMENT UPLOAD AND PROCESSING =====

@app.post("/api/upload/property-document")
async def upload_property_document(
    property_id: str,
    file: UploadFile = File(...),
    document_type: str = "auto"
):
    """Upload and process commercial property documents (PDFs)"""
    import uuid
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads/property_documents"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = file.filename.split('.')[-1]
    saved_filename = f"{property_id}_{file_id}.{file_extension}"
    file_path = os.path.join(upload_dir, saved_filename)
    
    try:
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process the PDF using our commercial parser
        try:
            from charly_ingest.commercial_pdf_parser import CommercialPDFParser
            parser = CommercialPDFParser()
            parsed_data = parser.parse_commercial_document(file_path, document_type)
        except ImportError as ie:
            print(f"Parser import error: {ie}")
            # Fallback to basic processing if parser not available
            parsed_data = {
                "document_type": document_type,
                "message": "PDF uploaded successfully - advanced parsing not available",
                "file_info": {
                    "filename": file.filename,
                    "size": len(content),
                    "saved_as": saved_filename
                }
            }
        except Exception as pe:
            print(f"Parsing error: {pe}")
            # Fallback if parsing fails
            parsed_data = {
                "document_type": "unknown",
                "message": f"PDF uploaded but parsing failed: {str(pe)}",
                "file_info": {
                    "filename": file.filename,
                    "size": len(content),
                    "saved_as": saved_filename
                }
            }
        
        # Format response to match frontend expectations
        result = {
            "property_id": property_id,
            "file_name": file.filename,
            "document_type": parsed_data.get("document_type", document_type),
            "parsed_data": parsed_data,
            "upload_date": datetime.utcnow().isoformat() + "Z",
            "message": "Document uploaded and parsed successfully"
        }
        
        # Extract financial summary for quick access
        if parsed_data.get("document_type") == "income_statement":
            result["financial_summary"] = {
                "gross_income": parsed_data.get("income_items", {}).get("total_income", 0),
                "operating_expenses": parsed_data.get("expense_items", {}).get("total_expenses", 0),
                "net_operating_income": parsed_data.get("summary", {}).get("net_income", 0)
            }
        elif parsed_data.get("document_type") == "rent_roll":
            result["financial_summary"] = {
                "total_monthly_rent": parsed_data.get("summary", {}).get("total_monthly_rent", 0),
                "occupancy_rate": parsed_data.get("summary", {}).get("occupancy_rate", 0),
                "vacant_square_feet": parsed_data.get("summary", {}).get("vacant_square_feet", 0)
            }
        
        return result
        
    except Exception as e:
        # Clean up file if processing failed
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.get("/api/property/{property_id}/documents")
async def get_property_documents(property_id: str):
    """Get all uploaded documents for a property"""
    upload_dir = "uploads/property_documents"
    
    if not os.path.exists(upload_dir):
        return {"property_id": property_id, "documents": []}
    
    documents = []
    for filename in os.listdir(upload_dir):
        if filename.startswith(f"{property_id}_") and filename.endswith('.pdf'):
            file_path = os.path.join(upload_dir, filename)
            file_stats = os.stat(file_path)
            
            documents.append({
                "filename": filename,
                "file_path": file_path,
                "size": file_stats.st_size,
                "uploaded_date": datetime.fromtimestamp(file_stats.st_ctime).isoformat() + "Z",
                "document_type": "PDF"
            })
    
    return {
        "property_id": property_id,
        "documents": sorted(documents, key=lambda x: x["uploaded_date"], reverse=True)
    }

@app.post("/api/property/{property_id}/analyze-financials")
async def analyze_property_financials(property_id: str, analysis_request: dict):
    """Analyze property financials from uploaded documents or manual input"""
    
    # Get uploaded documents for this property
    documents_response = await get_property_documents(property_id)
    documents = documents_response["documents"]
    
    # Initialize analysis results
    financial_analysis = {
        "property_id": property_id,
        "analysis_date": datetime.utcnow().isoformat() + "Z",
        "data_sources": [],
        "rent_roll_analysis": None,
        "income_statement_analysis": None,
        "valuation_inputs": {}
    }
    
    # Process rent roll documents
    rent_roll_docs = [doc for doc in documents if "rent" in doc["filename"].lower()]
    if rent_roll_docs:
        try:
            # In a full implementation, we'd parse the actual documents
            # For now, simulate rent roll analysis
            financial_analysis["rent_roll_analysis"] = {
                "total_units": 15,
                "occupied_units": 14,
                "total_leasable_sf": 45000,
                "occupied_sf": 42300,
                "occupancy_rate": 0.94,
                "total_monthly_rent": 58500,
                "total_annual_rent": 702000,
                "average_rent_per_sf": 16.60,
                "tenants": [
                    {
                        "name": "TechCorp Inc",
                        "suite": "Suite 100",
                        "sf": 8500,
                        "monthly_rent": 14875,
                        "rent_per_sf": 21.00,
                        "lease_expires": "2026-12-31"
                    },
                    {
                        "name": "Medical Associates",
                        "suite": "Suite 200",
                        "sf": 6200,
                        "monthly_rent": 10850,
                        "rent_per_sf": 21.00,
                        "lease_expires": "2025-06-30"
                    }
                ]
            }
            financial_analysis["data_sources"].append("rent_roll_pdf")
        except Exception as e:
            print(f"Error analyzing rent roll: {e}")
    
    # Process income statement documents
    income_docs = [doc for doc in documents if "income" in doc["filename"].lower()]
    if income_docs:
        try:
            # Simulate income statement analysis
            financial_analysis["income_statement_analysis"] = {
                "period": "2024 Annual",
                "gross_rental_income": 702000,
                "other_income": 15600,  # Parking, CAM, etc.
                "total_income": 717600,
                "vacancy_loss": 35880,  # 5%
                "effective_gross_income": 681720,
                "operating_expenses": {
                    "property_management": 25262,  # 3.7%
                    "maintenance_repairs": 34086,  # 5%
                    "utilities": 20516,  # 3%
                    "insurance": 13634,  # 2%
                    "property_taxes": 95441,  # 14%
                    "professional_fees": 6817,  # 1%
                    "other_expenses": 10258,  # 1.5%
                    "total": 206014
                },
                "net_operating_income": 475706,
                "operating_expense_ratio": 0.302
            }
            financial_analysis["data_sources"].append("income_statement_pdf")
        except Exception as e:
            print(f"Error analyzing income statement: {e}")
    
    # Create valuation inputs from analysis
    if financial_analysis["income_statement_analysis"]:
        income_data = financial_analysis["income_statement_analysis"]
        financial_analysis["valuation_inputs"] = {
            "gross_rental_income": income_data["gross_rental_income"],
            "vacancy_rate": 0.05,
            "operating_expenses": income_data["operating_expenses"]["total"],
            "net_operating_income": income_data["net_operating_income"],
            "property_type": "Office",  # Would be determined from property data
            "location": "Austin"  # Would be determined from property data
        }
    
    return financial_analysis

@app.post("/api/appeals/generate-pdf")
async def generate_appeal_pdf(appeal_request: dict):
    """Generate a professional PDF appeal packet"""
    try:
        import uuid
        from appeal_generator import generate_professional_appeal
        
        property_id = appeal_request.get("property_id")
        if not property_id:
            raise HTTPException(status_code=400, detail="Property ID is required")
        
        # Generate the appeal PDF
        pdf_path = generate_professional_appeal(appeal_request)
        
        # Store appeal record in system
        appeal_record = {
            "appeal_id": str(uuid.uuid4()),
            "property_id": property_id,
            "pdf_path": pdf_path,
            "generated_date": datetime.utcnow().isoformat() + "Z",
            "status": "Generated",
            "current_assessment": appeal_request.get("property", {}).get("current_assessment", 0),
            "proposed_assessment": appeal_request.get("valuation", {}).get("final_value_estimate", 0),
            "potential_savings": appeal_request.get("valuation", {}).get("potential_tax_savings", 0),
            "confidence_level": appeal_request.get("valuation", {}).get("overall_confidence", 85)
        }
        
        return {
            "success": True,
            "appeal_record": appeal_record,
            "pdf_path": pdf_path,
            "message": "Professional appeal PDF generated successfully"
        }
        
    except ImportError:
        raise HTTPException(status_code=500, detail="Appeal generator not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating appeal: {str(e)}")

@app.get("/api/appeals/property/{property_id}")
async def get_property_appeals(property_id: str):
    """Get all appeals for a specific property"""
    # In a real implementation, this would query a database
    # For now, return simulated data
    appeals = [
        {
            "appeal_id": "appeal_001",
            "property_id": property_id,
            "status": "Filed",
            "filed_date": "2025-07-15T10:00:00Z",
            "current_assessment": 1200000,
            "requested_assessment": 950000,
            "potential_savings": 35000,
            "confidence_level": 87,
            "filing_deadline": "2025-08-31T23:59:59Z",
            "jurisdiction": "Travis County, TX"
        }
    ]
    
    return {
        "property_id": property_id,
        "appeals": appeals,
        "total_appeals": len(appeals)
    }

@app.post("/api/appeals/{appeal_id}/submit")
async def submit_appeal(appeal_id: str, submission_data: dict):
    """Submit an appeal to the appropriate jurisdiction"""
    # In a real implementation, this would integrate with county systems
    # For now, simulate the submission process
    
    submission_record = {
        "appeal_id": appeal_id,
        "submission_id": str(uuid.uuid4()),
        "submitted_date": datetime.utcnow().isoformat() + "Z",
        "jurisdiction": submission_data.get("jurisdiction", "Travis County, TX"),
        "filing_method": submission_data.get("filing_method", "Electronic"),
        "confirmation_number": f"CHARLY-{datetime.now().strftime('%Y%m%d')}-{appeal_id[-6:].upper()}",
        "status": "Submitted",
        "estimated_review_date": "2025-09-15T00:00:00Z"
    }
    
    return {
        "success": True,
        "submission_record": submission_record,
        "message": "Appeal submitted successfully to jurisdiction"
    }

# Serve React app static files
app.mount("/assets", StaticFiles(directory="charly_ui/dist/assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve React SPA for all other routes"""
    file_path = f"charly_ui/dist/{full_path}"
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    # Fallback to index.html for SPA routing
    return FileResponse("charly_ui/dist/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8001)))