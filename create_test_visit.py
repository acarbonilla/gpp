import os
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gpp.settings')
django.setup()

from core.models import VisitRequest, Visitor
from django.contrib.auth.models import User
from django.utils import timezone

def create_test_visit():
    # Get or create a visitor
    visitor, created = Visitor.objects.get_or_create(
        email='test@example.com',
        defaults={
            'full_name': 'John Test Visitor',
            'contact': '+1234567890',
            'address': '123 Test Street'
        }
    )
    
    # Get the attendant user
    attendant = User.objects.get(username='attendant')
    
    # Create a visit for today
    today = timezone.now().date()
    scheduled_time = timezone.make_aware(datetime.combine(today, datetime.min.time().replace(hour=14, minute=0)))  # 2 PM today
    
    visit = VisitRequest.objects.create(
        visitor=visitor,
        employee=attendant,
        purpose='Test visit for lobby functionality',
        scheduled_time=scheduled_time,
        status='approved',
        visit_type='scheduled'
    )
    
    print(f"Created test visit:")
    print(f"  ID: {visit.id}")
    print(f"  Visitor: {visitor.full_name}")
    print(f"  Employee: {attendant.username}")
    print(f"  Scheduled: {scheduled_time}")
    print(f"  Status: {visit.status}")
    print(f"  Type: {visit.visit_type}")
    
    return visit

if __name__ == '__main__':
    create_test_visit() 