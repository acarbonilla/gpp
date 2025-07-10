import os
import django
import requests
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from core.models import VisitRequest, Visitor
from django.utils import timezone

# Test database queries
print("=== Database Test ===")
today = timezone.now().date()
print(f"Today's date: {today}")

# Check all approved visits
all_approved = VisitRequest.objects.filter(status='approved', visitor__isnull=False)
print(f"All approved visits: {all_approved.count()}")

for visit in all_approved:
    print(f"Visit ID: {visit.id}, Type: {visit.visit_type}, Scheduled: {visit.scheduled_time}, Date: {visit.scheduled_time.date() if visit.scheduled_time else 'None'}")

# Check today's visits with date filter
today_visits = VisitRequest.objects.filter(
    status='approved',
    scheduled_time__date=today,
    visitor__isnull=False
)
print(f"Today's visits (date filter): {today_visits.count()}")

# Check with range filter
today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
today_end = timezone.make_aware(datetime.combine(today, datetime.max.time()))

today_visits_range = VisitRequest.objects.filter(
    status='approved',
    scheduled_time__range=(today_start, today_end),
    visitor__isnull=False
)
print(f"Today's visits (range filter): {today_visits_range.count()}")

print("\n=== API Test ===")
# Test the API endpoint (without auth for now)
try:
    response = requests.get('http://localhost:8000/api/lobby/today-visitors/')
    print(f"API Response Status: {response.status_code}")
    print(f"API Response: {response.text}")
except Exception as e:
    print(f"API Error: {e}") 