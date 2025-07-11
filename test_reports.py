import os
import django
import requests
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from core.models import VisitRequest, Visitor, VisitLog
from django.contrib.auth.models import User
from django.utils import timezone

# Test the reports functionality
print("=== Testing Reports API ===")

# Create test data if needed
try:
    # Get or create a test user
    test_user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    
    # Get or create a test visitor
    test_visitor, created = Visitor.objects.get_or_create(
        email='visitor@example.com',
        defaults={'full_name': 'Test Visitor'}
    )
    
    # Create a test visit request
    test_visit, created = VisitRequest.objects.get_or_create(
        employee=test_user,
        visitor=test_visitor,
        purpose='Test visit for reports',
        scheduled_time=timezone.now() - timedelta(days=1),
        defaults={'status': 'approved'}
    )
    
    print(f"Test visit created: {test_visit}")
    
    # Test the reports API endpoint
    print("\n=== Testing Reports API Endpoint ===")
    
    # You would need to get a valid token first
    # For now, let's just test the model properties
    print(f"Visit ID: {test_visit.id}")
    print(f"Visitor: {test_visit.visitor.full_name}")
    print(f"Employee: {test_visit.employee.username}")
    print(f"Status: {test_visit.status}")
    print(f"Is checked in: {test_visit.is_checked_in}")
    print(f"Is checked out: {test_visit.is_checked_out}")
    
    # Test the reports view logic
    start_date = (timezone.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    end_date = timezone.now().strftime('%Y-%m-%d')
    
    print(f"\nDate range: {start_date} to {end_date}")
    
    # Test the queryset logic
    queryset = VisitRequest.objects.filter(
        scheduled_time__gte=datetime.strptime(start_date, '%Y-%m-%d'),
        scheduled_time__lte=datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
    )
    
    print(f"Total visits in range: {queryset.count()}")
    print(f"Approved visits: {queryset.filter(status='approved').count()}")
    print(f"Checked in visits: {queryset.filter(is_checked_in=True, is_checked_out=False).count()}")
    print(f"Checked out visits: {queryset.filter(is_checked_out=True).count()}")
    
    print("\n=== Reports API Test Complete ===")
    
except Exception as e:
    print(f"Error during testing: {e}")
    import traceback
    traceback.print_exc() 