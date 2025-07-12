import os
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from core.models import VisitRequest, Visitor, User
from django.utils import timezone

print("=== Database Visit Request Status Check ===")

# Check all visit requests
all_visits = VisitRequest.objects.all()
print(f"Total visit requests: {all_visits.count()}")

# Check by status
status_counts = {}
for visit in all_visits:
    status = visit.status
    if status not in status_counts:
        status_counts[status] = 0
    status_counts[status] += 1

print("\nVisit requests by status:")
for status, count in status_counts.items():
    print(f"  {status}: {count}")

# Check pending visits (status='pending')
pending_visits = VisitRequest.objects.filter(status='pending')
print(f"\nPending visits (status='pending'): {pending_visits.count()}")

for visit in pending_visits:
    print(f"  Visit ID: {visit.id}, Employee: {visit.employee.username}, Scheduled: {visit.scheduled_time}, Has visitor: {visit.visitor is not None}")

# Check approved visits that haven't checked in
approved_not_checked_in = VisitRequest.objects.filter(
    status='approved',
    visitor__isnull=False,
    visitlog__check_in_time__isnull=True
)
print(f"\nApproved visits not checked in: {approved_not_checked_in.count()}")

for visit in approved_not_checked_in:
    print(f"  Visit ID: {visit.id}, Employee: {visit.employee.username}, Visitor: {visit.visitor.full_name if visit.visitor else 'None'}, Scheduled: {visit.scheduled_time}")

# Check if there are any users
users = User.objects.all()
print(f"\nTotal users: {users.count()}")
for user in users:
    print(f"  User: {user.username}, Groups: {[g.name for g in user.groups.all()]}")

# Check if there are any visitors
visitors = Visitor.objects.all()
print(f"\nTotal visitors: {visitors.count()}")
for visitor in visitors:
    print(f"  Visitor: {visitor.full_name}, Email: {visitor.email}")

print("\n=== End Check ===") 