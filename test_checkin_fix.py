#!/usr/bin/env python3
"""
Test script to verify the check-in fix works correctly
"""

import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from core.models import VisitRequest, Visitor, User, VisitLog

def test_checkin_logic():
    """Test the check-in logic with various scenarios"""
    
    print("🧪 Testing Check-in Logic Fix")
    print("=" * 50)
    
    # Get or create test user and visitor
    user, created = User.objects.get_or_create(
        username='test_employee',
        defaults={'email': 'test@example.com'}
    )
    
    visitor, created = Visitor.objects.get_or_create(
        email='test_visitor@example.com',
        defaults={'full_name': 'Test Visitor'}
    )
    
    # Test scenarios
    scenarios = [
        {
            'name': 'Exact scheduled time',
            'scheduled_time': timezone.now(),
            'expected': 'Should allow check-in'
        },
        {
            'name': '5 minutes before scheduled time',
            'scheduled_time': timezone.now() + timedelta(minutes=5),
            'expected': 'Should allow check-in (early)'
        },
        {
            'name': '15 minutes after scheduled time',
            'scheduled_time': timezone.now() - timedelta(minutes=15),
            'expected': 'Should allow check-in (within 30min window)'
        },
        {
            'name': '35 minutes after scheduled time',
            'scheduled_time': timezone.now() - timedelta(minutes=35),
            'expected': 'Should NOT allow check-in (expired)'
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n📋 Test {i}: {scenario['name']}")
        print(f"   Expected: {scenario['expected']}")
        
        # Create test visit request
        visit = VisitRequest.objects.create(
            employee=user,
            visitor=visitor,
            purpose=f"Test visit - {scenario['name']}",
            scheduled_time=scenario['scheduled_time'],
            status='approved',
            visit_type='scheduled'
        )
        
        # Test the check-in logic
        from datetime import timedelta
        latest_checkin_time = visit.scheduled_time + timedelta(minutes=30)
        current_time = timezone.now()
        
        can_checkin = current_time <= latest_checkin_time
        
        print(f"   Scheduled: {visit.scheduled_time}")
        print(f"   Current:   {current_time}")
        print(f"   Latest allowed: {latest_checkin_time}")
        print(f"   Can check-in: {'✅ YES' if can_checkin else '❌ NO'}")
        
        # Clean up
        visit.delete()
    
    print("\n" + "=" * 50)
    print("✅ Check-in logic test completed!")

def test_no_show_logic():
    """Test the no-show logic"""
    
    print("\n🧪 Testing No-Show Logic")
    print("=" * 50)
    
    # Get or create test user and visitor
    user, created = User.objects.get_or_create(
        username='test_employee',
        defaults={'email': 'test@example.com'}
    )
    
    visitor, created = Visitor.objects.get_or_create(
        email='test_visitor@example.com',
        defaults={'full_name': 'Test Visitor'}
    )
    
    # Test scenarios for no-show
    scenarios = [
        {
            'name': '14 minutes late',
            'minutes_late': 14,
            'expected': 'Should NOT show no-show button'
        },
        {
            'name': '16 minutes late',
            'minutes_late': 16,
            'expected': 'Should show no-show button'
        },
        {
            'name': 'Exactly 15 minutes late',
            'minutes_late': 15,
            'expected': 'Should NOT show no-show button (with buffer)'
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n📋 Test {i}: {scenario['name']}")
        print(f"   Expected: {scenario['expected']}")
        
        # Calculate scheduled time based on minutes late
        scheduled_time = timezone.now() - timedelta(minutes=scenario['minutes_late'])
        
        # Create test visit request
        visit = VisitRequest.objects.create(
            employee=user,
            visitor=visitor,
            purpose=f"Test visit - {scenario['name']}",
            scheduled_time=scheduled_time,
            status='approved',
            visit_type='scheduled'
        )
        
        # Test the no-show logic (frontend equivalent)
        now = timezone.now()
        time_diff = now - visit.scheduled_time
        minutes_late = time_diff.total_seconds() / 60
        
        # Frontend logic with buffer
        buffer_minutes = 1
        should_show_no_show = minutes_late >= (15 + buffer_minutes)
        
        print(f"   Minutes late: {minutes_late:.1f}")
        print(f"   With buffer: {minutes_late >= (15 + buffer_minutes)}")
        print(f"   Should show no-show: {'✅ YES' if should_show_no_show else '❌ NO'}")
        
        # Clean up
        visit.delete()
    
    print("\n" + "=" * 50)
    print("✅ No-show logic test completed!")

if __name__ == "__main__":
    test_checkin_logic()
    test_no_show_logic() 