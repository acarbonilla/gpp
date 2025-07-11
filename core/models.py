from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone


class Visitor(models.Model):
    full_name = models.CharField(max_length=100, db_index=True)
    email = models.EmailField(db_index=True)
    contact = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['full_name']),
            models.Index(fields=['created_at']),
        ]

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

    employee = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    visitor = models.ForeignKey(Visitor, on_delete=models.SET_NULL, null=True, blank=True)
    purpose = models.TextField()
    scheduled_time = models.DateTimeField(db_index=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending', db_index=True)
    visit_type = models.CharField(max_length=10, choices=VISIT_TYPE_CHOICES, default='scheduled', db_index=True)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['employee', 'scheduled_time']),
            models.Index(fields=['status', 'scheduled_time']),
            models.Index(fields=['visitor', 'status']),
            models.Index(fields=['scheduled_time', 'status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['token']),
        ]
        ordering = ['-created_at']

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

    @property
    def is_checked_in(self):
        """Check if the visitor has checked in"""
        try:
            return self.visitlog.check_in_time is not None
        except VisitLog.DoesNotExist:
            return False

    @property
    def is_checked_out(self):
        """Check if the visitor has checked out"""
        try:
            return self.visitlog.check_out_time is not None
        except VisitLog.DoesNotExist:
            return False


class VisitLog(models.Model):
    visit_request = models.OneToOneField(VisitRequest, on_delete=models.CASCADE, db_index=True)
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, db_index=True)
    check_in_time = models.DateTimeField(blank=True, null=True, db_index=True)
    check_out_time = models.DateTimeField(blank=True, null=True, db_index=True)
    checked_in_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='check_ins')
    checked_out_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='check_outs')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['visit_request']),
            models.Index(fields=['visitor']),
            models.Index(fields=['check_in_time']),
            models.Index(fields=['check_out_time']),
            models.Index(fields=['checked_in_by']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.visitor.full_name} - {self.check_in_time.strftime('%Y-%m-%d %H:%M') if self.check_in_time else 'Not checked in'}"

    @property
    def is_checked_in(self):
        return self.check_in_time is not None

    @property
    def is_checked_out(self):
        return self.check_out_time is not None
