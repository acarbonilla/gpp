import os
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from core.models import VisitRequest, Visitor
from django.utils import timezone
from datetime import datetime, timedelta

# Test the database directly
print("=== Database Test ===")
today = timezone.now().date()
print(f"Today's date: {today}")

# Check all visits
all_visits = VisitRequest.objects.filter(visitor__isnull=False)
print(f"All visits: {all_visits.count()}")

for visit in all_visits:
    print(f"Visit ID: {visit.id}, Status: {visit.status}, Type: {visit.visit_type}, Visitor: {visit.visitor.full_name}, Scheduled: {visit.scheduled_time}")

# Check what the API query should return
api_visits = VisitRequest.objects.filter(
    status='approved',
    scheduled_time__date__in=[today, today + timedelta(days=1)],
    visitor__isnull=False
).select_related('visitor', 'employee')

print(f"\nAPI should return {api_visits.count()} visits:")
for visit in api_visits:
    print(f"Visit ID: {visit.id}, Status: {visit.status}, Type: {visit.visit_type}, Visitor: {visit.visitor.full_name}, Scheduled: {visit.scheduled_time}")

# Test the actual API endpoint
print(f"\n=== API Test ===")
try:
    # You'll need to get a valid token first
    # For now, let's just test the query logic
    print("API query logic test:")
    
    # Simulate the API response
    visitors_data = []
    for visit in api_visits:
        visitors_data.append({
            'visit_id': visit.id,
            'visitor_id': visit.visitor.id,
            'visitor_name': visit.visitor.full_name,
            'visitor_email': visit.visitor.email,
            'host_name': visit.employee.get_full_name() or visit.employee.username,
            'purpose': visit.purpose,
            'scheduled_time': visit.scheduled_time,
            'visit_type': visit.visit_type,
            'status': visit.status,
            'is_checked_in': False,
            'check_in_time': None,
            'is_checked_out': False,
            'check_out_time': None,
        })
    
    print(f"API would return {len(visitors_data)} visitors:")
    for visitor in visitors_data:
        print(f"  - {visitor['visitor_name']} (Status: {visitor['status']}, Type: {visitor['visit_type']})")
        
except Exception as e:
    print(f"Error testing API: {e}") 