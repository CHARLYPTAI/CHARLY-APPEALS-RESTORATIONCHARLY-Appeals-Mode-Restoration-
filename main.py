#!/usr/bin/env python3
"""
CHARLY Platform - GCP App Engine Entry Point
"""

import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="CHARLY Platform")

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
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))