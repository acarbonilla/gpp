#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from django.contrib.auth.models import User, Group
from core.models import Visitor, VisitRequest, VisitLog
from django.utils import timezone

def create_test_data():
    """Create sample data for testing Recent Activities"""
    print("Creating test data...")
    
    # Create or get test users
    employee, created = User.objects.get_or_create(
        username='test_employee',
        defaults={
            'email': 'employee@test.com',
            'first_name': 'Test',
            'last_name': 'Employee'
        }
    )
    
    lobby_attendant, created = User.objects.get_or_create(
        username='test_lobby',
        defaults={
            'email': 'lobby@test.com',
            'first_name': 'Test',
            'last_name': 'Lobby'
        }
    )
    
    # Ensure lobby_attendant is in the correct group
    lobby_group, created = Group.objects.get_or_create(name='lobby_attendant')
    lobby_attendant.groups.add(lobby_group)
    
    # Create test visitors
    visitors = []
    for i in range(3):
        visitor = Visitor.objects.create(
            full_name=f'Test Visitor {i+1}',
            email=f'visitor{i+1}@test.com',
            contact=f'+1234567890{i}',
            address=f'Test Address {i+1}',
            created_by=employee
        )
        visitors.append(visitor)
    
    # Create test visit requests
    now = timezone.now()
    visit_requests = []
    
    for i, visitor in enumerate(visitors):
        # Create visit request
        visit_request = VisitRequest.objects.create(
            employee=employee,
            visitor=visitor,
            purpose=f'Test Purpose {i+1}',
            scheduled_time=now + timedelta(hours=i),
            status='approved',
            visit_type='scheduled'
        )
        visit_requests.append(visit_request)
        
        # Create visit log for some visits
        if i < 2:
            visit_log = VisitLog.objects.create(
                visit_request=visit_request,
                visitor=visitor,
                check_in_time=now + timedelta(hours=i, minutes=30),
                checked_in_by=lobby_attendant
            )
            
            # Check out the first visitor
            if i == 0:
                visit_log.check_out_time = now + timedelta(hours=i+1)
                visit_log.checked_out_by = lobby_attendant
                visit_log.save()
    
    # Create a walk-in visit
    walkin_visitor = Visitor.objects.create(
        full_name='Walk-in Visitor',
        email='walkin@test.com',
        contact='+1234567899',
        address='Walk-in Address',
        created_by=lobby_attendant
    )
    
    walkin_request = VisitRequest.objects.create(
        employee=lobby_attendant,
        visitor=walkin_visitor,
        purpose='Walk-in Meeting',
        scheduled_time=now,
        status='approved',
        visit_type='walkin'
    )
    
    print(f"Created {len(visitors)} visitors, {len(visit_requests)} visit requests, and 1 walk-in")
    return employee, lobby_attendant

def test_recent_activities_api():
    """Test the Recent Activities API"""
    print("\nTesting Recent Activities API...")
    
    # First, get a valid token by logging in
    login_data = {
        'username': 'test_employee',
        'password': 'testpass123'  # You'll need to set this password
    }
    
    try:
        # Try to login (this might fail if password isn't set)
        login_response = requests.post(
            'http://localhost:8000/api/auth/login/',
            json=login_data
        )
        
        if login_response.status_code == 200:
            token = login_response.json()['token']
            print(f"Got token: {token[:20]}...")
            
            # Test Recent Activities API
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(
                'http://localhost:8000/api/recent-activities/',
                headers=headers
            )
            
            if response.status_code == 200:
                activities = response.json()
                print(f"\n✅ Recent Activities API Test SUCCESS!")
                print(f"Found {len(activities)} activities:")
                
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

def main():
    print("=== Recent Activities API Test ===\n")
    
    # Create test data
    employee, lobby_attendant = create_test_data()
    
    # Test the API
    success = test_recent_activities_api()
    
    if success:
        print("\n🎉 Test completed successfully!")
        print("\nTo see the activities in the frontend:")
        print("1. Open http://localhost:3000 in your browser")
        print("2. Login with username: test_employee")
        print("3. Check the Recent Activity section on the dashboard")
    else:
        print("\n❌ Test failed. Check the error messages above.")

if __name__ == '__main__':
    main() 