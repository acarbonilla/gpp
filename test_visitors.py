import os
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from core.models import VisitRequest, Visitor, VisitLog
from django.utils import timezone

# Check all approved visits
print("=== All Approved Visits ===")
all_approved = VisitRequest.objects.filter(status='approved', visitor__isnull=False)
print(f"Total approved visits: {all_approved.count()}")

for visit in all_approved:
    print(f"Visit ID: {visit.id}, Type: {visit.visit_type}, Visitor: {visit.visitor.full_name}, Scheduled: {visit.scheduled_time}, Date: {visit.scheduled_time.date()}")

# Check today's date
today = timezone.now().date()
print(f"\nToday's date: {today}")

# Check visits for today
today_visits = VisitRequest.objects.filter(
    status='approved',
    scheduled_time__date=today,
    visitor__isnull=False
)
print(f"\nVisits for today (using date filter): {today_visits.count()}")

for visit in today_visits:
    print(f"Visit ID: {visit.id}, Type: {visit.visit_type}, Visitor: {visit.visitor.full_name}, Scheduled: {visit.scheduled_time}")

# Check using range filter
today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
today_end = timezone.make_aware(datetime.combine(today, datetime.max.time()))

range_visits = VisitRequest.objects.filter(
    status='approved',
    scheduled_time__range=(today_start, today_end),
    visitor__isnull=False
)
print(f"\nVisits for today (using range filter): {range_visits.count()}")

for visit in range_visits:
    print(f"Visit ID: {visit.id}, Type: {visit.visit_type}, Visitor: {visit.visitor.full_name}, Scheduled: {visit.scheduled_time}") 