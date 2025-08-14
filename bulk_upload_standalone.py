#!/usr/bin/env python3
# LOC_CATEGORY: platform
"""
CHARLY Standalone Bulk Upload System
Simple, working bulk upload without complex dependencies
"""

import io
import zipfile
import time
from datetime import datetime
from typing import Dict, Any
import json

# Import the existing cloud uploader
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), 'charly_ui'))
    
    # Test cloud dependencies first
    
    CLOUD_SERVICES_AVAILABLE = True
except ImportError as e:
        CLOUD_SERVICES_AVAILABLE = False
    class MockCloudUploader:
        def get_available_services(self):
            return []
        @property
        def active_connections(self):
            return {}
        def authenticate_service(self, service_id, credentials):
            return False

# Initialize cloud uploader
if CLOUD_SERVICES_AVAILABLE:
    bulk_uploader = UniversalCloudUploader()
else:
    bulk_uploader = MockCloudUploader()

# Configure page
st.set_page_config(
    page_title="CHARLY Bulk Upload",
    page_icon="🚀",
    layout="wide"
)

# CSS for better styling
st.markdown("""
<style>
.upload-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e8ed;
    color: #333 !important;
}
.upload-card h4 {
    color: #333 !important;
    margin: 0 0 10px 0;
    font-weight: 600;
}
.upload-card p {
    color: #333 !important;
    margin: 5px 0;
    font-size: 14px;
}
.upload-card strong {
    color: #333 !important;
}
.success-card {
    background: #f0fff4;
    border: 1px solid #c6f6d5;
    border-radius: 8px;
    padding: 1rem;
    margin: 0.5rem 0;
}
</style>
""", unsafe_allow_html=True)

def render_quick_start():
    """Simple quick start interface"""
    st.title("🚀 CHARLY Bulk Upload System")
    st.markdown("Upload and process multiple property files at once")
    
    # Quick options
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #27AE60 0%, #2ECC71 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 10px 0;
            text-align: center;
            color: white;
            box-shadow: 0 6px 20px rgba(39, 174, 96, 0.3);
            transform: scale(1);
            transition: transform 0.2s ease;
        ">
            <div style="font-size: 3em; margin-bottom: 15px;">💻</div>
            <h4 style="color: white; margin: 15px 0; font-weight: 700; font-size: 1.3em;">Local Upload</h4>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0; font-weight: 600;"><strong>Best for:</strong> Files on your computer</p>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0; font-weight: 600;"><strong>Setup:</strong> None required</p>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0; font-weight: 600;"><strong>Time:</strong> Instant</p>
            <div style="margin-top: 15px;">
                <span style="background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 11px; font-weight: 700;">
                    NO SETUP NEEDED
                </span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("📁 Start Local Upload", type="primary", use_container_width=True):
            st.session_state['selected_tab'] = 'local'
            st.rerun()
    
    with col2:
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 10px 0;
            text-align: center;
            color: white;
            box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
            transform: scale(1);
            transition: transform 0.2s ease;
        ">
            <div style="font-size: 3em; margin-bottom: 15px;">🗜️</div>
            <h4 style="color: white; margin: 15px 0; font-weight: 700; font-size: 1.3em;">ZIP Extraction</h4>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0; font-weight: 600;"><strong>Best for:</strong> ZIP archives</p>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0; font-weight: 600;"><strong>Setup:</strong> None required</p>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0; font-weight: 600;"><strong>Time:</strong> Instant</p>
            <div style="margin-top: 15px;">
                <span style="background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 11px; font-weight: 700;">
                    NO SETUP NEEDED
                </span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("📦 Extract ZIP Files", type="primary", use_container_width=True):
            st.session_state['selected_tab'] = 'zip'
            st.rerun()
    
    with col3:
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 10px 0;
            text-align: center;
            color: white;
            box-shadow: 0 6px 20px rgba(155, 89, 182, 0.3);
            transform: scale(1);
            transition: transform 0.2s ease;
        ">
            <div style="font-size: 3em; margin-bottom: 15px;">☁️</div>
            <h4 style="color: white; margin: 15px 0; font-weight: 700; font-size: 1.3em;">Cloud Storage</h4>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0; font-weight: 600;"><strong>Best for:</strong> Google Drive, Dropbox</p>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0; font-weight: 600;"><strong>Setup:</strong> 3-5 minutes</p>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0; font-weight: 600;"><strong>Time:</strong> One-time setup</p>
            <div style="margin-top: 15px;">
                <span style="background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 11px; font-weight: 700;">
                    10 SERVICES AVAILABLE
                </span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("🔗 Setup Cloud Access", type="secondary", use_container_width=True):
            st.session_state['selected_tab'] = 'cloud'
            st.rerun()

def render_local_upload():
    """Simple local file upload"""
    st.header("💻 Local File Upload")
    
    # File uploader
    uploaded_files = st.file_uploader(
        "Select Property Data Files",
        type=['csv', 'xlsx', 'xls', 'pdf', 'txt', 'json', 'xml'],
        accept_multiple_files=True,
        help="Upload CSV, Excel, PDF, or other property data files"
    )
    
    if uploaded_files:
        st.success(f"✅ Selected {len(uploaded_files)} files for upload")
        
        # File preview
        file_data = []
        for file in uploaded_files:
            file_size = len(file.getvalue()) if hasattr(file, 'getvalue') else 0
            file_data.append({
                'File Name': file.name,
                'Size': f"{file_size / 1024 / 1024:.1f} MB",
                'Type': file.name.split('.')[-1].upper(),
                'Status': '✅ Ready'
            })
        
        df = pd.DataFrame(file_data)
        st.dataframe(df, use_container_width=True, hide_index=True)
        
        # Process button
        if st.button("🚀 Process Files", type="primary", use_container_width=True):
            process_files(uploaded_files)

def render_zip_upload():
    """Simple ZIP file upload"""
    st.header("🗜️ ZIP File Processing")
    
    uploaded_zip = st.file_uploader(
        "Upload ZIP Archive",
        type=['zip'],
        help="Upload a ZIP file containing multiple property data files"
    )
    
    if uploaded_zip:
        st.success(f"✅ ZIP file selected: {uploaded_zip.name}")
        
        try:
            with zipfile.ZipFile(uploaded_zip, 'r') as zip_ref:
                file_list = zip_ref.namelist()
                property_files = [f for f in file_list if any(f.lower().endswith(ext) 
                                for ext in ['.csv', '.xlsx', '.xls', '.pdf', '.txt', '.json', '.xml'])]
                
                if property_files:
                    st.info(f"📁 Found {len(property_files)} property data files in archive")
                    
                    # Show preview
                    preview_data = []
                    for file_path in property_files[:10]:  # Show first 10
                        preview_data.append({
                            'Path': file_path,
                            'Type': file_path.split('.')[-1].upper(),
                            'Status': '⏳ Ready'
                        })
                    
                    df = pd.DataFrame(preview_data)
                    st.dataframe(df, use_container_width=True, hide_index=True)
                    
                    if len(property_files) > 10:
                        st.info(f"... and {len(property_files) - 10} more files")
                    
                    # Extract and process button
                    if st.button("📦 Extract and Process", type="primary", use_container_width=True):
                        extract_and_process_zip(zip_ref, property_files)
                        
                else:
                    st.warning("⚠️ No property data files found in ZIP archive")
                    
        except Exception as e:
            st.error(f"❌ Error reading ZIP file: {str(e)}")

def render_cloud_services():
    """Cloud services integration"""
    st.header("☁️ Cloud Storage Integration")
    
    if not CLOUD_SERVICES_AVAILABLE:
        st.error("❌ Cloud services not available. Please install required dependencies:")
        st.code("pip install google-api-python-client dropbox boto3 azure-storage-blob paramiko", language="bash")
        return
    
    # Get available services from the uploader
    try:
        if hasattr(bulk_uploader, 'get_available_services'):
            available_services = bulk_uploader.get_available_services()
        else:
            # Manually extract from supported_services
            available_services = []
            for service_id, config in bulk_uploader.supported_services.items():
                if config.get('available', False):
                    service_info = {
                        'id': service_id,
                        'name': config['name'],
                        'icon': config['icon'],
                        'max_file_size': config['max_file_size'],
                        'batch_size': config['batch_size'],
                        'enterprise_ready': config.get('enterprise_ready', False)
                    }
                    available_services.append(service_info)
    except Exception as e:
        st.error(f"Error getting services: {e}")
        return
    
    if not available_services:
        st.warning("⚠️ No cloud services available. Please check your dependencies.")
        return
    
    st.success(f"✅ {len(available_services)} cloud services available!")
    
    # Recommended services
    st.markdown("### 🚀 Recommended Services (Easy Setup)")
    easy_services = [s for s in available_services if s['id'] in ['google_drive', 'dropbox']]
    
    if easy_services:
        cols = st.columns(len(easy_services))
        for i, service in enumerate(easy_services):
            with cols[i]:
                setup_time = "5 min" if service['id'] == 'google_drive' else "3 min"
                
                # Enhanced visual card with better styling
                card_color = "#4CAF50" if service['id'] == 'google_drive' else "#2196F3"
                st.markdown(f"""
                <div style="
                    background: white;
                    border: 2px solid {card_color};
                    border-radius: 12px;
                    padding: 20px;
                    margin: 10px 0;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transition: transform 0.2s ease;
                ">
                    <div style="font-size: 2.5em; margin-bottom: 10px;">{service['icon']}</div>
                    <h4 style="color: #333; margin: 10px 0; font-weight: 600;">{service['name']}</h4>
                    <p style="color: #666; margin: 5px 0;"><strong style="color: #333;">Setup Time:</strong> {setup_time}</p>
                    <p style="color: #666; margin: 5px 0;"><strong style="color: #333;">Max File:</strong> {service['max_file_size']}</p>
                    <p style="color: #666; margin: 5px 0;"><strong style="color: #333;">Batch Size:</strong> {service['batch_size']:,} files</p>
                    <div style="margin-top: 15px;">
                        <span style="background: {card_color}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                            RECOMMENDED
                        </span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                if st.button(f"🚀 Setup {service['name']}", key=f"easy_{service['id']}", type="primary", use_container_width=True):
                    render_service_auth_modal(service)
    
    # All services
    st.markdown("### 🌐 All Cloud Services")
    
    # Group services by type
    personal_services = [s for s in available_services if s['id'] in ['google_drive', 'dropbox', 'onedrive', 'icloud']]
    enterprise_services = [s for s in available_services if s['id'] in ['box', 'amazon_s3', 'azure_blob', 'sftp']]
    local_services = [s for s in available_services if s['id'] in ['local_folder', 'zip_extract']]
    
    if personal_services:
        st.markdown("#### 👤 Personal Cloud Services")
        cols = st.columns(4)
        for i, service in enumerate(personal_services):
            with cols[i % 4]:
                # Visual service card
                st.markdown(f"""
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 20px;
                    margin: 10px 0;
                    text-align: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                ">
                    <div style="font-size: 2.5em; margin-bottom: 10px;">{service['icon']}</div>
                    <h5 style="color: white; margin: 10px 0; font-weight: 600;">{service['name']}</h5>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0; font-size: 12px;">Max: {service['max_file_size']}</p>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0; font-size: 12px;">Batch: {service['batch_size']:,} files</p>
                </div>
                """, unsafe_allow_html=True)
                
                if st.button(f"Connect {service['name']}", key=f"personal_{service['id']}", use_container_width=True):
                    render_service_auth_modal(service)
    
    if enterprise_services:
        st.markdown("#### 🏢 Enterprise Cloud Services")
        cols = st.columns(4)
        for i, service in enumerate(enterprise_services):
            with cols[i % 4]:
                # Enterprise service card
                st.markdown(f"""
                <div style="
                    background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
                    border-radius: 12px;
                    padding: 20px;
                    margin: 10px 0;
                    text-align: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                ">
                    <div style="font-size: 2.5em; margin-bottom: 10px;">{service['icon']}</div>
                    <h5 style="color: white; margin: 10px 0; font-weight: 600;">{service['name']}</h5>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0; font-size: 12px;">Max: {service['max_file_size']}</p>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0; font-size: 12px;">Batch: {service['batch_size']:,} files</p>
                    <div style="margin-top: 10px;">
                        <span style="background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 15px; font-size: 10px; font-weight: 600;">
                            ENTERPRISE
                        </span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                if st.button(f"Setup {service['name']}", key=f"enterprise_{service['id']}", use_container_width=True):
                    render_service_auth_modal(service)
    
    if local_services:
        st.markdown("#### 💻 Local & Archive Processing")
        cols = st.columns(2)
        for i, service in enumerate(local_services):
            with cols[i % 2]:
                # Local service card
                st.markdown(f"""
                <div style="
                    background: linear-gradient(135deg, #27AE60 0%, #2ECC71 100%);
                    border-radius: 12px;
                    padding: 20px;
                    margin: 10px 0;
                    text-align: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                ">
                    <div style="font-size: 2.5em; margin-bottom: 10px;">{service['icon']}</div>
                    <h5 style="color: white; margin: 10px 0; font-weight: 600;">{service['name']}</h5>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0; font-size: 12px;">Max: {service['max_file_size']}</p>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0; font-size: 12px;">Batch: {service['batch_size']:,} files</p>
                    <div style="margin-top: 10px;">
                        <span style="background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 15px; font-size: 10px; font-weight: 600;">
                            NO SETUP
                        </span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                # These don't need authentication - redirect to appropriate tabs
                if service['id'] == 'local_folder':
                    if st.button(f"Use {service['name']}", key=f"local_{service['id']}", use_container_width=True):
                        st.session_state['selected_tab'] = 'local'
                        st.rerun()
                elif service['id'] == 'zip_extract':
                    if st.button(f"Use {service['name']}", key=f"zip_{service['id']}", use_container_width=True):
                        st.session_state['selected_tab'] = 'zip'
                        st.rerun()
    
    # Active connections
    if bulk_uploader.active_connections:
        st.markdown("### 🔗 Active Connections")
        for service_name, connection in bulk_uploader.active_connections.items():
            st.success(f"✅ Connected to {service_name.replace('_', ' ').title()}")

def render_service_auth_modal(service: Dict[str, Any]):
    """Render authentication modal for cloud service"""
    service_id = service['id']
    service_name = service['name']
    
    st.markdown(f"### 🔐 Connect to {service_name}")
    
    with st.form(f"auth_form_{service_id}"):
        credentials = {}
        
        if service_id == 'google_drive':
            st.info("📝 **Google Drive Setup:**")
            st.markdown("""
            1. Go to [Google Cloud Console](https://console.cloud.google.com)
            2. Create a new project or select existing
            3. Enable Google Drive API
            4. Create OAuth2 credentials
            5. Copy the credentials below:
            """)
            
            credentials['client_id'] = st.text_input(
                "Client ID", 
                placeholder="123456789-abc.apps.googleusercontent.com",
                help="Long code ending with .apps.googleusercontent.com"
            )
            credentials['client_secret'] = st.text_input(
                "Client Secret", 
                type="password",
                placeholder="GOCSPX-abcdef...",
                help="Shorter code starting with GOCSPX-"
            )
            credentials['redirect_uri'] = st.text_input(
                "Redirect URI", 
                value="http://localhost:8080",
                help="Must match what you set in Google Cloud Console"
            )
            
        elif service_id == 'dropbox':
            st.info("📝 **Dropbox Setup:**")
            st.markdown("""
            1. Go to [Dropbox Developers](https://www.dropbox.com/developers/apps)
            2. Create a new app with "Full Dropbox access"
            3. Copy the credentials below:
            """)
            
            credentials['app_key'] = st.text_input("App Key", help="From Dropbox App Console")
            credentials['app_secret'] = st.text_input("App Secret", type="password", help="From Dropbox App Console")
            credentials['access_token'] = st.text_input(
                "Access Token (Optional)", 
                type="password", 
                help="Generate this for instant access without OAuth"
            )
            
        elif service_id == 'amazon_s3':
            st.info("📝 **AWS S3 Setup:**")
            st.markdown("""
            1. Create IAM user with S3 permissions
            2. Generate access keys
            3. Copy the credentials below:
            """)
            
            credentials['aws_access_key_id'] = st.text_input("Access Key ID")
            credentials['aws_secret_access_key'] = st.text_input("Secret Access Key", type="password")
            credentials['region'] = st.selectbox("Region", [
                'us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1'
            ])
        
        # Add more services as needed...
        
        if st.form_submit_button("🔐 Connect", type="primary", use_container_width=True):
            authenticate_cloud_service(service_id, credentials)

def authenticate_cloud_service(service_id: str, credentials: Dict[str, Any]):
    """Authenticate with cloud service"""
    try:
        with st.spinner(f"Connecting to {service_id}..."):
            if not any(credentials.values()):
                st.error("❌ Please fill in the required fields.")
                return
            
            success = bulk_uploader.authenticate_service(service_id, credentials)
            
            if success:
                st.success(f"✅ Successfully connected to {service_id}!")
                st.balloons()
                time.sleep(2)
                st.rerun()
            else:
                st.error("❌ Connection failed. Please check your credentials.")
                
    except Exception as e:
        st.error(f"❌ Connection error: {str(e)}")

def process_files(uploaded_files):
    """Process uploaded files with progress tracking"""
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    results = []
    
    for i, file in enumerate(uploaded_files):
        status_text.text(f"Processing {file.name}...")
        
        try:
            # Simulate processing time
            time.sleep(0.5)
            
            # Simple file analysis
            file_size = len(file.getvalue()) if hasattr(file, 'getvalue') else 0
            
            # Try to process based on file type
            if file.name.lower().endswith('.csv'):
                df = pd.read_csv(file)
                record_count = len(df)
            elif file.name.lower().endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file)
                record_count = len(df)
            else:
                record_count = 1  # For other file types
            
            results.append({
                'filename': file.name,
                'success': True,
                'records': record_count,
                'size_mb': f"{file_size / 1024 / 1024:.1f}",
                'processing_time': 0.5
            })
            
        except Exception as e:
            results.append({
                'filename': file.name,
                'success': False,
                'records': 0,
                'size_mb': f"{file_size / 1024 / 1024:.1f}" if 'file_size' in locals() else "0",
                'processing_time': 0.5,
                'error': str(e)
            })
        
        progress_bar.progress((i + 1) / len(uploaded_files))
    
    status_text.text("Processing complete!")
    
    # Show results
    display_results(results)

def extract_and_process_zip(zip_ref, property_files):
    """Extract and process ZIP files"""
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    results = []
    
    for i, file_path in enumerate(property_files):
        status_text.text(f"Processing {file_path}...")
        
        try:
            # Extract file
            file_content = zip_ref.read(file_path)
            
            # Simple processing
            if file_path.lower().endswith('.csv'):
                df = pd.read_csv(io.BytesIO(file_content))
                record_count = len(df)
            elif file_path.lower().endswith(('.xlsx', '.xls')):
                df = pd.read_excel(io.BytesIO(file_content))
                record_count = len(df)
            else:
                record_count = 1
            
            results.append({
                'filename': file_path,
                'success': True,
                'records': record_count,
                'size_mb': f"{len(file_content) / 1024 / 1024:.1f}",
                'processing_time': 0.3
            })
            
        except Exception as e:
            results.append({
                'filename': file_path,
                'success': False,
                'records': 0,
                'size_mb': "0",
                'processing_time': 0.3,
                'error': str(e)
            })
        
        progress_bar.progress((i + 1) / len(property_files))
    
    status_text.text("Processing complete!")
    
    # Show results
    display_results(results)

def display_results(results):
    """Display processing results"""
    
    st.markdown("### 📊 Processing Results")
    
    # Summary metrics
    successful_files = [r for r in results if r['success']]
    failed_files = [r for r in results if not r['success']]
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Files", len(results))
    
    with col2:
        st.metric("Successful", len(successful_files))
    
    with col3:
        st.metric("Failed", len(failed_files))
    
    with col4:
        total_records = sum(r['records'] for r in successful_files)
        st.metric("Total Records", f"{total_records:,}")
    
    # Detailed results
    results_data = []
    for result in results:
        status = "✅ Success" if result['success'] else "❌ Failed"
        results_data.append({
            'File': result['filename'],
            'Status': status,
            'Records': result['records'],
            'Size (MB)': result['size_mb'],
            'Time (s)': f"{result['processing_time']:.1f}",
            'Error': result.get('error', '')[:50] if result.get('error') else ''
        })
    
    results_df = pd.DataFrame(results_data)
    st.dataframe(results_df, use_container_width=True, hide_index=True)
    
    # Download processed data
    if successful_files:
        st.markdown("### 📥 Download Results")
        
        # Create summary data
        summary_data = {
            'processing_summary': {
                'timestamp': datetime.now().isoformat(),
                'total_files': len(results),
                'successful_files': len(successful_files),
                'failed_files': len(failed_files),
                'total_records': total_records
            },
            'results': results_data
        }
        
        col1, col2 = st.columns(2)
        
        with col1:
            # CSV download
            csv_data = results_df.to_csv(index=False)
            st.download_button(
                label="📄 Download as CSV",
                data=csv_data,
                file_name=f"charly_bulk_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv"
            )
        
        with col2:
            # JSON download
            json_data = json.dumps(summary_data, indent=2)
            st.download_button(
                label="🔧 Download as JSON",
                data=json_data,
                file_name=f"charly_bulk_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json"
            )

def main():
    """Main application"""
    
    # Initialize session state
    if 'selected_tab' not in st.session_state:
        st.session_state['selected_tab'] = 'quick_start'
    
    # Sidebar navigation
    st.sidebar.title("🚀 CHARLY Bulk Upload")
    
    tab_choice = st.sidebar.radio(
        "Choose Upload Method:",
        ["🎯 Quick Start", "💻 Local Upload", "🗜️ ZIP Extraction", "☁️ Cloud Services"],
        index=0 if st.session_state['selected_tab'] == 'quick_start' else 
              1 if st.session_state['selected_tab'] == 'local' else 
              2 if st.session_state['selected_tab'] == 'zip' else 3
    )
    
    # Route to appropriate page
    if tab_choice == "🎯 Quick Start":
        render_quick_start()
    elif tab_choice == "💻 Local Upload":
        render_local_upload()
    elif tab_choice == "🗜️ ZIP Extraction":
        render_zip_upload()
    elif tab_choice == "☁️ Cloud Services":
        render_cloud_services()

if __name__ == "__main__":
    main()