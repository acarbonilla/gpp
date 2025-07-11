#!/usr/bin/env python3
"""
Create test users for debugging employee notifications
"""

import os
import sys
import django
from django.contrib.auth.models import User, Group

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

def create_test_users():
    """Create test employee and lobby attendant users"""
    
    print("👥 Creating test users...")
    
    # Create employee user
    employee_username = "test_employee"
    employee_password = "test123"
    
    try:
        employee_user = User.objects.get(username=employee_username)
        print(f"✅ Employee user '{employee_username}' already exists")
    except User.DoesNotExist:
        employee_user = User.objects.create_user(
            username=employee_username,
            email="employee@test.com",
            password=employee_password,
            first_name="Test",
            last_name="Employee"
        )
        print(f"✅ Created employee user: {employee_username} / {employee_password}")
    
    # Add employee user to employee group
    try:
        employee_group = Group.objects.get(name='employee')
        employee_user.groups.add(employee_group)
        print(f"✅ Added {employee_username} to employee group")
    except Group.DoesNotExist:
        print("⚠️  employee group not found - creating it")
        employee_group = Group.objects.create(name='employee')
        employee_user.groups.add(employee_group)
        print(f"✅ Created employee group and added {employee_username}")
    
    # Create lobby attendant user
    attendant_username = "test_attendant"
    attendant_password = "test123"
    
    try:
        attendant_user = User.objects.get(username=attendant_username)
        print(f"✅ Lobby attendant user '{attendant_username}' already exists")
    except User.DoesNotExist:
        attendant_user = User.objects.create_user(
            username=attendant_username,
            email="attendant@test.com",
            password=attendant_password,
            first_name="Test",
            last_name="Attendant"
        )
        
        # Add to lobby_attendant group
        try:
            attendant_group = Group.objects.get(name='lobby_attendant')
            attendant_user.groups.add(attendant_group)
            print(f"✅ Added {attendant_username} to lobby_attendant group")
        except Group.DoesNotExist:
            print("⚠️  lobby_attendant group not found - creating it")
            attendant_group = Group.objects.create(name='lobby_attendant')
            attendant_user.groups.add(attendant_group)
        
        print(f"✅ Created lobby attendant user: {attendant_username} / {attendant_password}")
    
    print("\n📋 Test User Credentials:")
    print("=" * 40)
    print(f"Employee:     {employee_username} / {employee_password}")
    print(f"Lobby Attendant: {attendant_username} / {attendant_password}")
    print("=" * 40)
    
    print("\n🧪 Testing steps:")
    print("1. Login as employee: http://localhost:3000/login")
    print("2. Create a visit request for today")
    print("3. Login as lobby attendant in another tab")
    print("4. Check in the visitor from lobby")
    print("5. Check employee notifications")
    
    return employee_user, attendant_user

if __name__ == "__main__":
    create_test_users() 