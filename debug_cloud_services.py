#!/usr/bin/env python3
# LOC_CATEGORY: platform
"""
Debug Cloud Services Availability
Check exactly what's happening with the bulk upload interface
"""

import sys
import os

# Add paths like Streamlit would
sys.path.insert(0, os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'charly_ui'))

print("🔍 DEBUGGING CLOUD SERVICES AVAILABILITY")
print("=" * 60)

print("\n1️⃣ Testing Direct UniversalCloudUploader...")
try:
    from charly_ui.universal_cloud_uploader import bulk_uploader
    print("✅ Direct import successful")
    print(f"✅ bulk_uploader type: {type(bulk_uploader).__name__}")
    
    services = bulk_uploader.get_available_services()
    print(f"✅ Available services: {len(services)}")
    
    for service in services:
        available_icon = "✅" if service.get('available', True) else "❌"
        print(f"   {available_icon} {service['name']} - Max: {service['max_file_size']}")
        
except Exception as e:
    print(f"❌ Direct import failed: {e}")
    import traceback
    traceback.print_exc()

print("\n2️⃣ Testing BulkUploadInterface Import...")
try:
    from charly_ui.bulk_upload_interface import bulk_uploader as interface_uploader
    print("✅ Interface import successful")
    print(f"✅ Interface uploader type: {type(interface_uploader).__name__}")
    
    interface_services = interface_uploader.get_available_services()
    print(f"✅ Interface available services: {len(interface_services)}")
    
    if len(interface_services) == 0:
        print("⚠️ WARNING: Interface uploader has 0 services - MockUploader is active!")
        print("   This means the import in bulk_upload_interface.py is failing")
    
except Exception as e:
    print(f"❌ Interface import failed: {e}")
    import traceback
    traceback.print_exc()

print("\n3️⃣ Testing App Integration...")
try:
    from charly_ui.app import BULK_UPLOAD_AVAILABLE
    print(f"✅ App BULK_UPLOAD_AVAILABLE: {BULK_UPLOAD_AVAILABLE}")
    
    if not BULK_UPLOAD_AVAILABLE:
        print("⚠️ WARNING: App thinks bulk upload is not available!")
        
except Exception as e:
    print(f"❌ App integration test failed: {e}")

print("\n4️⃣ Testing Dependency Availability...")
dependencies = {
    'google-api-python-client': 'googleapiclient',
    'dropbox': 'dropbox', 
    'boto3': 'boto3',
    'azure-storage-blob': 'azure.storage.blob',
    'paramiko': 'paramiko'
}

for dep_name, import_name in dependencies.items():
    try:
        __import__(import_name)
        print(f"✅ {dep_name}: Available")
    except ImportError:
        print(f"❌ {dep_name}: Missing")

print("\n5️⃣ Simulating Streamlit Environment...")
# This simulates what happens when Streamlit loads the module
import importlib

try:
    # Force reload modules to simulate fresh Streamlit import
    if 'charly_ui.bulk_upload_interface' in sys.modules:
        importlib.reload(sys.modules['charly_ui.bulk_upload_interface'])
    
    # Import as Streamlit would
    from charly_ui.bulk_upload_interface import bulk_uploader as streamlit_uploader
    
    print("✅ Streamlit simulation successful")
    print(f"✅ Streamlit uploader type: {type(streamlit_uploader).__name__}")
    
    streamlit_services = streamlit_uploader.get_available_services()
    print(f"✅ Streamlit available services: {len(streamlit_services)}")
    
    if len(streamlit_services) == 0:
        print("🚨 FOUND THE ISSUE: Streamlit environment has 0 services!")
        print("   The MockUploader is being used in the Streamlit context")
    else:
        print("✅ Streamlit environment is working correctly")
    
except Exception as e:
    print(f"❌ Streamlit simulation failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("🏁 DIAGNOSIS COMPLETE")

# Final summary
if 'streamlit_services' in locals() and len(streamlit_services) > 0:
    print("✅ RESULT: Cloud services are working correctly!")
    print("📱 Visit http://localhost:8505 → 'Bulk Operations' to test")
else:
    print("❌ RESULT: Issue found - MockUploader is active in Streamlit context")
    print("🔧 SOLUTION: Check import paths and module loading in Streamlit")