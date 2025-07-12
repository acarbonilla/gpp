#!/usr/bin/env python3
"""
Test script for the new Dashboard Analytics endpoint
"""

import requests
import json
from datetime import datetime, timedelta

def test_dashboard_analytics():
    # Test the new endpoint
    base_url = "http://localhost:8000"
    
    # First, let's try to login to get a token
    login_data = {
        "username": "employee@company.com",  # Replace with actual test user
        "password": "testpass123"  # Replace with actual test password
    }
    
    try:
        # Try to login
        login_response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
        
        if login_response.status_code == 200:
            token = login_response.json().get('token')
            print(f"✅ Login successful, got token: {token[:20]}...")
            
            # Test the dashboard analytics endpoint
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            # Test with date range
            start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            end_date = datetime.now().strftime('%Y-%m-%d')
            
            analytics_response = requests.get(
                f"{base_url}/api/dashboard-analytics/",
                headers=headers,
                params={
                    'start_date': start_date,
                    'end_date': end_date
                }
            )
            
            print(f"📊 Dashboard Analytics Response Status: {analytics_response.status_code}")
            
            if analytics_response.status_code == 200:
                data = analytics_response.json()
                print("✅ Dashboard Analytics endpoint working!")
                print(f"📈 Data received: {json.dumps(data, indent=2)}")
            else:
                print(f"❌ Dashboard Analytics failed: {analytics_response.text}")
                
        else:
            print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django server is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🧪 Testing Dashboard Analytics Endpoint...")
    test_dashboard_analytics() 