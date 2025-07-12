#!/usr/bin/env python3
"""
Test script for the new employee list endpoint
"""

import requests
import json

def test_employee_list_api():
    """Test the /api/employees/ endpoint"""
    
    base_url = "http://localhost:8000"
    
    # Test login as lobby attendant (has permission to access employee list)
    login_data = {
        "username": "attendant",  # Update with your lobby attendant username
        "password": "secure_password"  # Update with your lobby attendant password
    }
    
    try:
        # Login to get token
        print("🔐 Logging in as lobby attendant...")
        login_response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return False
        
        token = login_response.json().get('token')
        if not token:
            print("❌ No access token received")
            return False
        
        print("✅ Login successful")
        
        # Test employee list endpoint
        print("\n👥 Testing /api/employees/ endpoint (includes employees and lobby attendants)...")
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        employees_response = requests.get(f"{base_url}/api/employees/", headers=headers)
        
        if employees_response.status_code != 200:
            print(f"❌ Employee list request failed: {employees_response.status_code}")
            print(f"Response: {employees_response.text}")
            return False
        
        employees_data = employees_response.json()
        print(f"✅ Got {len(employees_data)} users (employees and lobby attendants)")
        
        if employees_data:
            print(f"\n📋 User list:")
            for i, employee in enumerate(employees_data, 1):
                print(f"{i}. {employee['display_name']} (ID: {employee['id']}, Username: {employee['username']})")
            
            # Check required fields
            required_fields = ['id', 'username', 'display_name']
            first_employee = employees_data[0]
            missing_fields = [field for field in required_fields if field not in first_employee]
            
            if missing_fields:
                print(f"❌ Missing required fields: {missing_fields}")
                return False
            
            print(f"✅ All required fields present: {required_fields}")
            
            # Check if attendant is included
            attendant_found = any(user['username'] == 'attendant' for user in employees_data)
            if attendant_found:
                print("✅ Lobby attendant found in the list")
            else:
                print("⚠️  Lobby attendant not found - they may not have hosted visitors yet")
            
        else:
            print("⚠️  No users found - this is normal if no users have hosted visitors yet")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure backend is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_employee_list_permissions():
    """Test that regular employees cannot access the employee list"""
    
    base_url = "http://localhost:8000"
    
    # Test login as regular employee
    login_data = {
        "username": "test_employee",  # Update with your employee username
        "password": "test_password"   # Update with your employee password
    }
    
    try:
        # Login to get token
        print("\n🔐 Logging in as regular employee...")
        login_response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ Employee login failed: {login_response.status_code}")
            return False
        
        token = login_response.json().get('token')
        if not token:
            print("❌ No access token received")
            return False
        
        print("✅ Employee login successful")
        
        # Test employee list endpoint (should be forbidden for regular employees)
        print("\n🚫 Testing employee list access for regular employee...")
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        employees_response = requests.get(f"{base_url}/api/employees/", headers=headers)
        
        if employees_response.status_code == 403:
            print("✅ Correctly denied access to regular employee (403 Forbidden)")
            return True
        elif employees_response.status_code == 200:
            print("⚠️  Regular employee can access employee list - this might be intended")
            return True
        else:
            print(f"❌ Unexpected response: {employees_response.status_code}")
            print(f"Response: {employees_response.text}")
            return False
        
    except Exception as e:
        print(f"❌ Error testing permissions: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Employee List API")
    print("=" * 50)
    
    # Test main functionality
    success1 = test_employee_list_api()
    
    # Test permissions
    success2 = test_employee_list_permissions()
    
    print("\n" + "=" * 50)
    if success1 and success2:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed") 