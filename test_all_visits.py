import os
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from core.models import VisitRequest, Visitor, VisitLog
from django.utils import timezone

# Check all visits (not just approved)
print("=== All Visits ===")
all_visits = VisitRequest.objects.filter(visitor__isnull=False)
print(f"Total visits: {all_visits.count()}")

for visit in all_visits:
    print(f"Visit ID: {visit.id}, Status: {visit.status}, Type: {visit.visit_type}, Visitor: {visit.visitor.full_name}, Scheduled: {visit.scheduled_time}")

# Check by status
print("\n=== Visits by Status ===")
for status in ['pending', 'approved', 'rejected']:
    status_visits = VisitRequest.objects.filter(status=status, visitor__isnull=False)
    print(f"{status.capitalize()} visits: {status_visits.count()}")
    for visit in status_visits:
        print(f"  - Visit ID: {visit.id}, Type: {visit.visit_type}, Visitor: {visit.visitor.full_name}, Scheduled: {visit.scheduled_time}")

# Check today's date
today = timezone.now().date()
print(f"\nToday's date: {today}")

# Check what the API should return
today_visits = VisitRequest.objects.filter(
    status='approved',
    scheduled_time__date__in=[today, today + timezone.timedelta(days=1)],
    visitor__isnull=False
)
print(f"\nAPI should return {today_visits.count()} approved visits for today/tomorrow:")
for visit in today_visits:
    print(f"  - Visit ID: {visit.id}, Type: {visit.visit_type}, Visitor: {visit.visitor.full_name}, Scheduled: {visit.scheduled_time}") 