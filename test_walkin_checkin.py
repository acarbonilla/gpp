import os
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from core.models import VisitRequest, Visitor, User
from django.utils import timezone

def test_walkin_checkin():
    print("=== Testing Walk-In Check-In Process ===")
    
    # Get or create a test user (lobby attendant)
    try:
        user = User.objects.get(username='lobby_attendant')
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='lobby_attendant',
            email='lobby@test.com',
            password='testpass123'
        )
        print(f"Created test user: {user.username}")
    
    # Get or create a test visitor
    try:
        visitor = Visitor.objects.get(email='test_walkin@example.com')
    except Visitor.DoesNotExist:
        visitor = Visitor.objects.create(
            full_name='Test Walk-In Visitor',
            email='test_walkin@example.com',
            contact='+1234567890',
            address='Test Address',
            created_by=user
        )
        print(f"Created test visitor: {visitor.full_name}")
    
    # Create a walk-in visit
    now = timezone.now()
    walkin_visit = VisitRequest.objects.create(
        employee=user,
        visitor=visitor,
        purpose='Test Walk-In Visit - Visiting John Doe',
        scheduled_time=now,
        status='approved',
        visit_type='walkin'
    )
    
    print(f"\nCreated walk-in visit:")
    print(f"  Visit ID: {walkin_visit.id}")
    print(f"  Visitor ID: {visitor.id}")
    print(f"  Scheduled Time: {walkin_visit.scheduled_time}")
    print(f"  Status: {walkin_visit.status}")
    print(f"  Visit Type: {walkin_visit.visit_type}")
    
    # Simulate the check-in logic
    print(f"\n=== Simulating Check-In Logic ===")
    
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)
    
    print(f"Today: {today}")
    print(f"Yesterday: {yesterday}")
    print(f"Tomorrow: {tomorrow}")
    print(f"Visit scheduled date: {walkin_visit.scheduled_time.date()}")
    
    # Test the date filtering logic
    visits_in_range = VisitRequest.objects.filter(
        visitor_id=visitor.id,
        status='approved',
        scheduled_time__date__gte=yesterday,
        scheduled_time__date__lte=tomorrow
    ).order_by('-scheduled_time')
    
    print(f"\nVisits found with date filtering: {visits_in_range.count()}")
    for visit in visits_in_range:
        print(f"  - Visit {visit.id}: {visit.scheduled_time} ({visit.visit_type})")
    
    # Test broader search
    all_approved_visits = VisitRequest.objects.filter(
        visitor_id=visitor.id,
        status='approved'
    ).order_by('-scheduled_time')
    
    print(f"\nAll approved visits for visitor: {all_approved_visits.count()}")
    for visit in all_approved_visits:
        print(f"  - Visit {visit.id}: {visit.scheduled_time} ({visit.visit_type})")
    
    # Test if the visit can be found
    found_visit = visits_in_range.first()
    if not found_visit:
        found_visit = all_approved_visits.first()
    
    if found_visit:
        print(f"\n✅ SUCCESS: Found visit {found_visit.id} for check-in")
        print(f"   Scheduled: {found_visit.scheduled_time}")
        print(f"   Type: {found_visit.visit_type}")
        print(f"   Status: {found_visit.status}")
    else:
        print(f"\n❌ FAILED: No visit found for check-in")
    
    # Clean up test data
    print(f"\n=== Cleaning up test data ===")
    walkin_visit.delete()
    visitor.delete()
    print("Test data cleaned up")

if __name__ == '__main__':
    test_walkin_checkin() 