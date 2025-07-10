from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone


class Visitor(models.Model):
    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    contact = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


class VisitRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('canceled', 'Canceled'),
        ('no_show', 'No Show'),
        ('expired', 'Expired'),
    ]

    VISIT_TYPE_CHOICES = [
        ('scheduled', 'Pre-Approved'),
        ('walkin', 'Walk-In'),
    ]

    employee = models.ForeignKey(User, on_delete=models.CASCADE)
    visitor = models.ForeignKey(Visitor, on_delete=models.SET_NULL, null=True, blank=True)
    purpose = models.TextField()
    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    visit_type = models.CharField(max_length=10, choices=VISIT_TYPE_CHOICES, default='scheduled')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.visitor.full_name if self.visitor else 'Unknown'} - {self.scheduled_time.strftime('%Y-%m-%d %H:%M')}"

    @property
    def is_expired(self):
        """Check if the visit request has expired (past scheduled time and still pending)"""
        return self.status == 'pending' and self.scheduled_time < timezone.now()

    @classmethod
    def expire_pending_requests(cls):
        """Automatically expire pending visit requests that are past their scheduled time"""
        now = timezone.now()
        expired_requests = cls.objects.filter(
            status='pending',
            scheduled_time__lt=now
        )
        count = expired_requests.count()
        expired_requests.update(status='expired')
        return count


class VisitLog(models.Model):
    visit_request = models.OneToOneField(VisitRequest, on_delete=models.CASCADE)
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE)
    check_in_time = models.DateTimeField(blank=True, null=True)
    check_out_time = models.DateTimeField(blank=True, null=True)
    checked_in_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='check_ins')
    checked_out_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='check_outs')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.visitor.full_name} - {self.check_in_time.strftime('%Y-%m-%d %H:%M') if self.check_in_time else 'Not checked in'}"

    @property
    def is_checked_in(self):
        return self.check_in_time is not None

    @property
    def is_checked_out(self):
        return self.check_out_time is not None
