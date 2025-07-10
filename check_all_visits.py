import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from core.models import VisitRequest, Visitor
from django.utils import timezone

print("=== COMPREHENSIVE VISIT CHECK ===")

# Check ALL visits (including those without visitors)
all_visits = VisitRequest.objects.all()
print(f"Total visits in database: {all_visits.count()}")

for visit in all_visits:
    visitor_name = visit.visitor.full_name if visit.visitor else "No visitor"
    print(f"Visit ID: {visit.id}, Status: {visit.status}, Type: {visit.visit_type}, Visitor: {visitor_name}, Scheduled: {visit.scheduled_time}")

# Check visits with visitors only
visits_with_visitors = VisitRequest.objects.filter(visitor__isnull=False)
print(f"\nVisits with visitors: {visits_with_visitors.count()}")

for visit in visits_with_visitors:
    print(f"Visit ID: {visit.id}, Status: {visit.status}, Type: {visit.visit_type}, Visitor: {visit.visitor.full_name}, Scheduled: {visit.scheduled_time}")

# Check by status
print(f"\n=== BY STATUS ===")
for status in ['pending', 'approved', 'rejected']:
    status_visits = VisitRequest.objects.filter(status=status)
    print(f"{status.capitalize()} visits: {status_visits.count()}")
    for visit in status_visits:
        visitor_name = visit.visitor.full_name if visit.visitor else "No visitor"
        print(f"  - Visit ID: {visit.id}, Type: {visit.visit_type}, Visitor: {visitor_name}, Scheduled: {visit.scheduled_time}") 