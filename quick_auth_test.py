#!/usr/bin/env python3
import sys
sys.path.append('fastapi_backend')

from core.auth import login_user, LoginRequest, get_user_by_email

# Test authentication
try:
    user = get_user_by_email("admin@charly.com")
    if user:
        print(f"✅ User found: {user.email}")
        print(f"Role: {user.role}")
        print(f"Permissions: {len(user.permissions)}")
    else:
        print("❌ User not found")
        
    # Test login
    req = LoginRequest(email="admin@charly.com", password="CharlyCTO2025!")
    token = login_user(req)
    print(f"✅ Login successful - Token: {token.access_token[:50]}...")
    
except Exception as e:
    print(f"❌ Error: {e}")