#!/usr/bin/env python
import os
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from django.contrib.auth.models import User, Group
from core.models import Visitor, VisitRequest
from django.utils import timezone

def test_employee_activities():
    """Test the Recent Activities API for employees"""
    print("Testing Employee Recent Activities...")
    
    # Create a test employee user
    employee, created = User.objects.get_or_create(
        username='test_employee',
        defaults={
            'email': 'employee@test.com',
            'first_name': 'Test',
            'last_name': 'Employee'
        }
    )
    
    if created:
        employee.set_password('testpass123')
        employee.save()
        print("Created test employee user")
    else:
        print("Test employee user already exists")
    
    # Create a test visitor
    visitor = Visitor.objects.create(
        full_name='Test Visitor',
        email='visitor@test.com',
        contact='+1234567890',
        address='Test Address',
        created_by=employee
    )
    
    # Create a test visit request
    visit_request = VisitRequest.objects.create(
        employee=employee,
        visitor=visitor,
        purpose='Test Purpose',
        scheduled_time=timezone.now(),
        status='approved',
        visit_type='scheduled'
    )
    
    print(f"Created test data: Visitor '{visitor.full_name}', Visit Request ID {visit_request.id}")
    
    # Test the API
    try:
        # Login to get token
        login_response = requests.post(
            'http://localhost:8000/api/auth/login/',
            json={
                'username': 'test_employee',
                'password': 'testpass123'
            }
        )
        
        if login_response.status_code == 200:
            token = login_response.json()['token']
            print(f"Login successful, got token: {token[:20]}...")
            
            # Test Recent Activities API
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(
                'http://localhost:8000/api/recent-activities/',
                headers=headers
            )
            
            if response.status_code == 200:
                activities = response.json()
                print(f"\n✅ SUCCESS! Found {len(activities)} activities:")
                
                for i, activity in enumerate(activities, 1):
                    print(f"\n{i}. {activity['message']}")
                    print(f"   Details: {activity['details']}")
                    print(f"   Time: {activity['time_display']}")
                    print(f"   Type: {activity['type']} ({activity['color']})")
                
                return True
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure Django server is running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    test_employee_activities() 