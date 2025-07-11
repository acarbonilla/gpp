#!/usr/bin/env python3
"""
Quick API test to verify employee notification fix
"""

import requests
import json

def test_my_visitors_api():
    """Test that /api/my-visitors/ returns employee_name field"""
    
    base_url = "http://localhost:8000"
    
    # Test login (you'll need to update with real credentials)
    login_data = {
        "username": "test_employee",  # Update with your employee username
        "password": "test_password"   # Update with your employee password
    }
    
    try:
        # Login to get token
        print("🔐 Logging in...")
        login_response = requests.post(f"{base_url}/api/login/", json=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return False
        
        token = login_response.json().get('access_token')
        if not token:
            print("❌ No access token received")
            return False
        
        print("✅ Login successful")
        
        # Test my-visitors endpoint
        print("\n📋 Testing /api/my-visitors/ endpoint...")
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        visitors_response = requests.get(f"{base_url}/api/my-visitors/", headers=headers)
        
        if visitors_response.status_code != 200:
            print(f"❌ My visitors request failed: {visitors_response.status_code}")
            print(f"Response: {visitors_response.text}")
            return False
        
        visitors_data = visitors_response.json()
        print(f"✅ Got {len(visitors_data)} visitors")
        
        # Check if employee_name field is present
        if visitors_data:
            first_visitor = visitors_data[0]
            print(f"\n📊 First visitor data:")
            print(json.dumps(first_visitor, indent=2, default=str))
            
            required_fields = ['visit_id', 'visitor_name', 'employee_name', 'status']
            missing_fields = [field for field in required_fields if field not in first_visitor]
            
            if missing_fields:
                print(f"❌ Missing required fields: {missing_fields}")
                return False
            
            print(f"✅ All required fields present: {required_fields}")
            
            # Check employee_name format
            employee_name = first_visitor.get('employee_name')
            if not employee_name:
                print("❌ employee_name is empty or null")
                return False
            
            print(f"✅ employee_name: '{employee_name}'")
            
        else:
            print("⚠️  No visitors found - this is normal if no visits are scheduled")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure backend is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_lobby_visitors_api():
    """Test that lobby endpoint works for comparison"""
    
    base_url = "http://localhost:8000"
    
    # Test login as lobby attendant
    login_data = {
        "username": "attendant",  # Update with your lobby attendant username
        "password": "secure_password"  # Update with your lobby attendant password
    }
    
    try:
        # Login to get token
        print("\n🔐 Logging in as lobby attendant...")
        login_response = requests.post(f"{base_url}/api/login/", json=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ Lobby attendant login failed: {login_response.status_code}")
            return False
        
        token = login_response.json().get('access_token')
        if not token:
            print("❌ No access token received")
            return False
        
        print("✅ Lobby attendant login successful")
        
        # Test today-visitors endpoint
        print("\n📋 Testing /api/lobby/today-visitors/ endpoint...")
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        visitors_response = requests.get(f"{base_url}/api/lobby/today-visitors/", headers=headers)
        
        if visitors_response.status_code != 200:
            print(f"❌ Today visitors request failed: {visitors_response.status_code}")
            return False
        
        visitors_data = visitors_response.json()
        print(f"✅ Got {len(visitors_data)} visitors for lobby")
        
        if visitors_data:
            first_visitor = visitors_data[0]
            print(f"\n📊 First lobby visitor data:")
            print(json.dumps(first_visitor, indent=2, default=str))
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing lobby API: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Employee Notification API Fix")
    print("=" * 50)
    
    # Test employee API
    employee_test = test_my_visitors_api()
    
    # Test lobby API for comparison
    lobby_test = test_lobby_visitors_api()
    
    print("\n" + "=" * 50)
    if employee_test and lobby_test:
        print("✅ All API tests passed!")
        print("🎉 Employee notification fix is working correctly")
    else:
        print("❌ Some tests failed. Check the output above.")
    
    print("\n📝 Next steps:")
    print("1. Update the credentials in this script with your actual users")
    print("2. Run the frontend tests using TEST_EMPLOYEE_NOTIFICATIONS.md")
    print("3. Check browser console for notification system logs") 