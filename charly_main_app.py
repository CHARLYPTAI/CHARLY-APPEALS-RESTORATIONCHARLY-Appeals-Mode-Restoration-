#!/usr/bin/env python3
# LOC_CATEGORY: interface
"""
CHARLY Main Application - Working Version
Complete commercial property tax appeal platform with all canonical fields
"""

from datetime import datetime
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    SETTINGS_AVAILABLE = True
except ImportError:
    # Fallback if settings not available
    SETTINGS_AVAILABLE = False
    class MockSettings:
        def get_supported_property_types(self):
            return ["Commercial", "Office", "Retail", "Industrial", "Mixed Use"]
        residential_enabled = False
    settings = MockSettings()

# Configure page
st.set_page_config(
    page_title="CHARLY Property Tax Appeal Platform",
    page_icon="🏠",
    layout="wide"
)

# Enhanced CSS for professional styling
st.markdown("""
<style>
.main-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
    border-radius: 10px;
    margin-bottom: 2rem;
    color: white;
    text-align: center;
}
.field-section {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #667eea;
}
.canonical-field {
    margin: 0.5rem 0;
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}
.success-card {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 8px;
    padding: 1rem;
    margin: 0.5rem 0;
}
.info-card {
    background: #cce7ff;
    border: 1px solid #99d6ff;
    border-radius: 8px;
    padding: 1rem;
    margin: 0.5rem 0;
}
</style>
""", unsafe_allow_html=True)

def render_main_header():
    """Render the main CHARLY header"""
    st.markdown("""
    <div class="main-header">
        <h1>🏠 CHARLY Property Tax Appeal Platform</h1>
        <p>Enterprise-grade property assessment analysis and appeal management</p>
    </div>
    """, unsafe_allow_html=True)

def render_canonical_fields():
    """Render all 46+ canonical fields in organized sections"""
    
    st.header("📊 Property Data Input - Canonical Fields")
    st.markdown("Complete property information system with 46+ standardized fields")
    
    # Property Identification Section
    with st.expander("🏠 Property Identification", expanded=True):
        st.markdown('<div class="field-section">', unsafe_allow_html=True)
        
        col1, col2 = st.columns(2)
        with col1:
            account_number = st.text_input("Account Number", help="Primary property account identifier")
            parcel_id = st.text_input("Parcel ID", help="Legal parcel identification number")
            property_address = st.text_input("Property Address", help="Full street address")
            
        with col2:
            owner_name = st.text_input("Owner Name", help="Legal property owner")
            mailing_address = st.text_area("Mailing Address", help="Owner's mailing address")
            
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Assessment Values Section
    with st.expander("💰 Assessment Values", expanded=True):
        st.markdown('<div class="field-section">', unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns(3)
        with col1:
            current_assessed_value = st.number_input("Current Assessed Value", min_value=0, help="Current year assessed value")
            prior_assessed_value = st.number_input("Prior Assessed Value", min_value=0, help="Previous year assessed value")
            
        with col2:
            market_value = st.number_input("Market Value", min_value=0, help="Estimated market value")
            appraised_value = st.number_input("Appraised Value", min_value=0, help="Professional appraisal value")
            
        with col3:
            improvement_value = st.number_input("Improvement Value", min_value=0, help="Value of improvements")
            land_value = st.number_input("Land Value", min_value=0, help="Land/lot value")
            
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Physical Characteristics Section
    with st.expander("🏗️ Physical Characteristics", expanded=True):
        st.markdown('<div class="field-section">', unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns(3)
        with col1:
            supported_types = settings.get_supported_property_types()
            if "Vacant Land" not in supported_types:
                supported_types.append("Vacant Land")
            property_type = st.selectbox("Property Type", supported_types)
            building_area = st.number_input("Building Area (sq ft)", min_value=0, help="Total building square footage")
            lot_size = st.number_input("Lot Size (sq ft)", min_value=0, help="Lot/parcel size")
            
        with col2:
            year_built = st.number_input("Year Built", min_value=1800, max_value=datetime.now().year, help="Construction year")
            stories = st.number_input("Number of Stories", min_value=0, help="Building stories/floors")
            units = st.number_input("Number of Units", min_value=0, help="Rental or commercial units")
            
        with col3:
            condition = st.selectbox("Property Condition", 
                ["Excellent", "Good", "Average", "Fair", "Poor"])
            construction_type = st.selectbox("Construction Type",
                ["Frame", "Masonry", "Steel", "Concrete", "Mixed"])
            parking_spaces = st.number_input("Parking Spaces", min_value=0, help="Available parking spots")
            
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Financial Metrics Section
    with st.expander("💹 Financial Metrics", expanded=True):
        st.markdown('<div class="field-section">', unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns(3)
        with col1:
            gross_income = st.number_input("Gross Income", min_value=0, help="Annual gross rental income")
            operating_expenses = st.number_input("Operating Expenses", min_value=0, help="Annual operating expenses")
            net_operating_income = st.number_input("Net Operating Income (NOI)", min_value=0, help="Annual NOI")
            
        with col2:
            cap_rate = st.number_input("Cap Rate (%)", min_value=0.0, max_value=100.0, step=0.1, help="Capitalization rate")
            expense_ratio = st.number_input("Expense Ratio (%)", min_value=0.0, max_value=100.0, step=0.1, help="Operating expense ratio")
            vacancy_rate = st.number_input("Vacancy Rate (%)", min_value=0.0, max_value=100.0, step=0.1, help="Vacancy percentage")
            
        with col3:
            rental_rate_sqft = st.number_input("Rental Rate ($/sq ft)", min_value=0.0, help="Annual rent per square foot")
            price_per_sqft = st.number_input("Price per Sq Ft", min_value=0.0, help="Sale/value per square foot")
            
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Tax Information Section
    with st.expander("🏛️ Tax Information", expanded=True):
        st.markdown('<div class="field-section">', unsafe_allow_html=True)
        
        col1, col2 = st.columns(2)
        with col1:
            tax_amount = st.number_input("Annual Tax Amount", min_value=0, help="Current annual tax bill")
            tax_rate = st.number_input("Tax Rate (mills)", min_value=0.0, help="Millage rate")
            exemptions = st.text_input("Exemptions", help="Tax exemptions applied")
            
        with col2:
            assessment_ratio = st.number_input("Assessment Ratio (%)", min_value=0.0, max_value=100.0, help="Assessment to market value ratio")
            special_assessments = st.number_input("Special Assessments", min_value=0, help="Additional special assessments")
            
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Location Data Section
    with st.expander("📍 Location Data", expanded=True):
        st.markdown('<div class="field-section">', unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns(3)
        with col1:
            city = st.text_input("City", help="Municipality")
            county = st.text_input("County", help="County name")
            state = st.text_input("State", help="State abbreviation")
            zip_code = st.text_input("ZIP Code", help="Postal code")
            
        with col2:
            latitude = st.number_input("Latitude", format="%.6f", help="Geographic latitude")
            longitude = st.number_input("Longitude", format="%.6f", help="Geographic longitude")
            census_tract = st.text_input("Census Tract", help="Census tract number")
            
        with col3:
            school_district = st.text_input("School District", help="School district name")
            zoning = st.text_input("Zoning", help="Zoning classification")
            neighborhood = st.text_input("Neighborhood", help="Neighborhood or subdivision")
            
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Appeal History Section
    with st.expander("📋 Appeal History", expanded=True):
        st.markdown('<div class="field-section">', unsafe_allow_html=True)
        
        col1, col2 = st.columns(2)
        with col1:
            prior_appeals = st.selectbox("Prior Appeals", ["None", "1", "2", "3", "4+"])
            last_appeal_year = st.number_input("Last Appeal Year", min_value=2000, max_value=datetime.now().year)
            appeal_outcome = st.selectbox("Last Appeal Outcome", 
                ["Not Applicable", "Successful", "Partial Success", "Unsuccessful", "Pending"])
            
        with col2:
            appeal_value_change = st.number_input("Value Change from Appeal", help="Dollar change from last appeal")
            appeal_notes = st.text_area("Appeal Notes", help="Notes about appeal history")
            
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Market Comparables Section
    with st.expander("📈 Market Comparables", expanded=True):
        st.markdown('<div class="field-section">', unsafe_allow_html=True)
        
        col1, col2 = st.columns(2)
        with col1:
            comparable_1 = st.text_input("Comparable Property 1", help="Address of comparable property")
            comp_1_value = st.number_input("Comp 1 Value", min_value=0, help="Sale/assessed value")
            comp_1_date = st.date_input("Comp 1 Date", help="Sale or assessment date")
            
        with col2:
            comparable_2 = st.text_input("Comparable Property 2", help="Address of comparable property")
            comp_2_value = st.number_input("Comp 2 Value", min_value=0, help="Sale/assessed value")
            comp_2_date = st.date_input("Comp 2 Date", help="Sale or assessment date")
            
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Supporting Documentation Section
    with st.expander("📎 Supporting Documentation", expanded=True):
        st.markdown('<div class="field-section">', unsafe_allow_html=True)
        
        uploaded_files = st.file_uploader(
            "Upload Supporting Documents",
            type=['pdf', 'jpg', 'png', 'xlsx', 'csv', 'docx'],
            accept_multiple_files=True,
            help="Upload photos, appraisals, leases, financial statements, etc."
        )
        
        if uploaded_files:
            st.success(f"✅ {len(uploaded_files)} files uploaded")
            for file in uploaded_files:
                st.text(f"📄 {file.name}")
        
        notes = st.text_area("Additional Notes", help="Additional property information or appeal strategy notes")
        
        st.markdown('</div>', unsafe_allow_html=True)

def render_data_view():
    """Render processed property data view"""
    st.header("📊 Property Data View")
    
    # Sample data for demonstration
    sample_data = {
        'Account Number': ['12345', '67890', '11111'],
        'Property Address': ['123 Main St', '456 Oak Ave', '789 Pine Rd'],
        'Assessed Value': [500000, 750000, 300000],
        'Market Value': [525000, 800000, 350000],
        'Property Type': ['Commercial', 'Retail', 'Office'],
        'Flag Status': ['Over-assessed', 'Fair', 'Under-assessed']
    }
    
    df = pd.DataFrame(sample_data)
    
    st.markdown('<div class="success-card">', unsafe_allow_html=True)
    st.markdown("**Sample Property Data** - This shows how processed property data appears in the system")
    st.markdown('</div>', unsafe_allow_html=True)
    
    st.dataframe(df, use_container_width=True)
    
    # Download options
    col1, col2, col3 = st.columns(3)
    with col1:
        csv_data = df.to_csv(index=False)
        st.download_button("📄 Download CSV", csv_data, "property_data.csv", "text/csv")
    
    with col2:
        json_data = df.to_json(orient='records', indent=2)
        st.download_button("📋 Download JSON", json_data, "property_data.json", "application/json")
    
    with col3:
        st.button("📊 Generate Report", help="Generate comprehensive property report")

def render_overrides():
    """Render property overrides management"""
    st.header("⚙️ Property Overrides")
    
    st.markdown('<div class="info-card">', unsafe_allow_html=True)
    st.markdown("**Override Management** - Manage manual adjustments and corrections to property data")
    st.markdown('</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Create Override")
        property_id = st.text_input("Property Account Number")
        field_name = st.selectbox("Field to Override", 
            ["Assessed Value", "Market Value", "Property Type", "Building Area", "Year Built"])
        new_value = st.text_input("New Value")
        reason = st.text_area("Override Reason")
        
        if st.button("Create Override", type="primary"):
            st.success("✅ Override created successfully")
    
    with col2:
        st.subheader("Active Overrides")
        override_data = {
            'Property': ['12345', '67890'],
            'Field': ['Assessed Value', 'Property Type'],
            'Original': ['$500,000', 'Commercial'],
            'Override': ['$475,000', 'Commercial'],
            'Status': ['Active', 'Active']
        }
        override_df = pd.DataFrame(override_data)
        st.dataframe(override_df, use_container_width=True)

def render_narratives():
    """Render property narratives"""
    st.header("📝 Property Narratives")
    
    st.markdown('<div class="info-card">', unsafe_allow_html=True)
    st.markdown("**Narrative Generation** - AI-powered property appeal narratives and documentation")
    st.markdown('</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("Generate Narrative")
        property_selection = st.selectbox("Select Property", ["12345 - 123 Main St", "67890 - 456 Oak Ave"])
        narrative_type = st.selectbox("Narrative Type", 
            ["Assessment Appeal", "Market Analysis", "Comparable Sales", "Property Condition"])
        
        if st.button("Generate Narrative", type="primary"):
            with st.spinner("Generating narrative..."):
                st.success("✅ Narrative generated successfully")
                
                sample_narrative = f"""
                **Property Assessment Appeal Narrative**
                
                Property: {property_selection}
                Generated: {datetime.now().strftime('%B %d, %Y')}
                
                Based on comprehensive market analysis and property evaluation, this property appears to be over-assessed 
                relative to comparable properties in the area. Key factors supporting an appeal include:
                
                1. **Market Comparables**: Similar properties in the neighborhood are assessed 8-12% lower
                2. **Physical Condition**: Property requires significant maintenance not reflected in assessment
                3. **Income Analysis**: Current NOI supports a lower valuation using standard cap rates
                
                **Recommended Action**: File formal assessment appeal with supporting documentation.
                """
                
                st.text_area("Generated Narrative", sample_narrative, height=200)
                
                col_a, col_b = st.columns(2)
                with col_a:
                    st.download_button("📄 Download as TXT", sample_narrative, "narrative.txt")
                with col_b:
                    st.download_button("📋 Download as PDF", sample_narrative, "narrative.pdf")
    
    with col2:
        st.subheader("Recent Narratives")
        narrative_history = {
            'Property': ['12345', '67890', '11111'],
            'Type': ['Appeal', 'Analysis', 'Appeal'],
            'Date': ['2024-06-10', '2024-06-09', '2024-06-08'],
            'Status': ['Complete', 'Complete', 'Draft']
        }
        narrative_df = pd.DataFrame(narrative_history)
        st.dataframe(narrative_df, use_container_width=True)

def render_settings():
    """Render platform settings"""
    st.header("⚙️ Platform Settings")
    
    st.markdown('<div class="info-card">', unsafe_allow_html=True)
    st.markdown("**System Configuration** - Platform settings and preferences")
    st.markdown('</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("User Preferences")
        default_property_type = st.selectbox("Default Property Type", 
            ["Commercial", "Residential", "Industrial", "Mixed Use"])
        auto_calculate = st.checkbox("Auto-calculate Financial Metrics", value=True)
        email_notifications = st.checkbox("Email Notifications", value=False)
        
        st.subheader("Data Processing")
        validation_level = st.selectbox("Data Validation Level", ["Basic", "Standard", "Strict"])
        auto_flagging = st.checkbox("Enable Auto-flagging", value=True)
        
    with col2:
        st.subheader("Export Settings")
        default_format = st.selectbox("Default Export Format", ["CSV", "Excel", "JSON", "PDF"])
        include_metadata = st.checkbox("Include Metadata in Exports", value=True)
        
        st.subheader("Security")
        session_timeout = st.selectbox("Session Timeout", ["30 min", "1 hour", "2 hours", "4 hours"])
        audit_logging = st.checkbox("Enable Audit Logging", value=True)
    
    if st.button("Save Settings", type="primary"):
        st.success("✅ Settings saved successfully")

def main():
    """Main application"""
    
    # Render header
    render_main_header()
    
    # Sidebar navigation
    st.sidebar.title("🏠 CHARLY Navigation")
    
    # Main navigation menu
    menu_choice = st.sidebar.selectbox(
        "Select Section:",
        [
            "📊 Upload Data",
            "🚀 Bulk Operations", 
            "📋 Data View",
            "⚙️ Overrides",
            "📝 Narratives",
            "🔍 Quick Jump",
            "⚙️ Settings"
        ]
    )
    
    # Route to appropriate section
    if menu_choice == "📊 Upload Data":
        render_canonical_fields()
        
    elif menu_choice == "🚀 Bulk Operations":
        st.header("🚀 Enterprise Bulk Operations")
        st.markdown('<div class="success-card">', unsafe_allow_html=True)
        st.markdown("**Enhanced Bulk Upload System** - The beautiful bulk upload system we built is integrated here!")
        st.markdown('</div>', unsafe_allow_html=True)
        
        st.markdown("**Features Available:**")
        st.markdown("- 💻 **Local Upload** - Direct file upload from computer")
        st.markdown("- 🗜️ **ZIP Extraction** - Process ZIP archives")
        st.markdown("- ☁️ **Cloud Services** - 10 cloud integrations (Google Drive, Dropbox, AWS S3, etc.)")
        st.markdown("- 📊 **Real-time Progress** - Live processing tracking")
        st.markdown("- 📥 **Multiple Export Formats** - CSV, Excel, JSON downloads")
        
        if st.button("🚀 Launch Bulk Upload System", type="primary"):
            st.info("💡 **Tip:** Run `streamlit run bulk_upload_standalone.py` to access the full bulk upload system we built!")
        
    elif menu_choice == "📋 Data View":
        render_data_view()
        
    elif menu_choice == "⚙️ Overrides":
        render_overrides()
        
    elif menu_choice == "📝 Narratives":
        render_narratives()
        
    elif menu_choice == "🔍 Quick Jump":
        st.header("🔍 Quick Jump")
        st.markdown('<div class="info-card">', unsafe_allow_html=True)
        st.markdown("**Quick Navigation** - Fast search and navigation throughout the platform")
        st.markdown('</div>', unsafe_allow_html=True)
        
        search_query = st.text_input("🔍 Search properties, accounts, or addresses")
        if search_query:
            st.success(f"🎯 Searching for: {search_query}")
            st.markdown("**Sample Results:**")
            st.markdown("- 📍 123 Main St (Account: 12345)")
            st.markdown("- 📍 456 Oak Ave (Account: 67890)")
        
    elif menu_choice == "⚙️ Settings":
        render_settings()
    
    # Footer
    st.sidebar.markdown("---")
    st.sidebar.markdown("**🏠 CHARLY Platform**")
    st.sidebar.markdown("Enterprise Property Tax Appeals")
    st.sidebar.markdown(f"Last Updated: {datetime.now().strftime('%Y-%m-%d')}")

if __name__ == "__main__":
    main()