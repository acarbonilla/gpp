#!/usr/bin/env python3
"""
Fix existing test_employee user by adding them to employee group
"""

import os
import sys
import django
from django.contrib.auth.models import User, Group

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

def fix_test_employee():
    """Fix the existing test_employee user by adding them to employee group"""
    
    print("🔧 Fixing test_employee user...")
    
    try:
        # Get the existing test_employee user
        employee_user = User.objects.get(username='test_employee')
        print(f"✅ Found existing user: {employee_user.username}")
        
        # Check if employee group exists, create if not
        try:
            employee_group = Group.objects.get(name='employee')
            print("✅ Employee group exists")
        except Group.DoesNotExist:
            print("⚠️  Employee group not found - creating it")
            employee_group = Group.objects.create(name='employee')
            print("✅ Created employee group")
        
        # Check if user is already in the group
        if employee_user.groups.filter(name='employee').exists():
            print("✅ User is already in employee group")
        else:
            # Add user to employee group
            employee_user.groups.add(employee_group)
            print("✅ Added test_employee to employee group")
        
        # Print current groups
        user_groups = list(employee_user.groups.values_list('name', flat=True))
        print(f"📋 User groups: {user_groups}")
        
        return True
        
    except User.DoesNotExist:
        print("❌ test_employee user not found")
        print("Run create_test_user.py first to create the user")
        return False

if __name__ == "__main__":
    success = fix_test_employee()
    if success:
        print("\n🎉 test_employee user fixed successfully!")
        print("You can now login and test employee notifications")
    else:
        print("\n❌ Failed to fix test_employee user") 