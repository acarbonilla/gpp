from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class Visitor(models.Model):
    full_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=254)
    contact = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email'], name='core_visito_email_4b1d47_idx'),
            models.Index(fields=['full_name'], name='core_visito_full_na_e17917_idx'),
            models.Index(fields=['created_at'], name='core_visito_created_568fc0_idx'),
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
        ('expired', 'Expired')
    ]
    
    VISIT_TYPE_CHOICES = [
        ('scheduled', 'Pre-Approved'),
        ('walkin', 'Walk-In')
    ]
    
    visitor = models.ForeignKey(
        Visitor, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True
    )
    employee = models.ForeignKey(User, on_delete=models.CASCADE)
    original_employee = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='original_visits'
    )
    purpose = models.TextField()
    scheduled_time = models.DateTimeField()
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    visit_type = models.CharField(
        max_length=10, 
        choices=VISIT_TYPE_CHOICES, 
        default='scheduled'
    )
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'status'], name='core_visitr_employe_8ea4d0_idx'),
            models.Index(fields=['employee', 'scheduled_time'], name='core_visitr_employe_3c08c0_idx'),
            models.Index(fields=['status', 'scheduled_time'], name='core_visitr_status_ac000a_idx'),
            models.Index(fields=['visitor', 'status'], name='core_visitr_visitor_504857_idx'),
            models.Index(fields=['scheduled_time', 'status'], name='core_visitr_schedul_d86d0f_idx'),
            models.Index(fields=['created_at'], name='core_visitr_created_0e9203_idx'),
            models.Index(fields=['original_employee', 'status'], name='core_visitr_origina_5c49d7_idx'),
            models.Index(fields=['original_employee', 'scheduled_time'], name='core_visitr_origina_042bc0_idx'),
        ]

    def __str__(self):
        return f"{self.visitor.full_name if self.visitor else 'Unknown'} - {self.employee.username}"

    @property
    def is_expired(self):
        """Check if the visit request has expired"""
        return self.scheduled_time < timezone.now() and self.status == 'pending'

    @property
    def is_checked_in(self):
        """Check if the visitor has checked in"""
        try:
            return self.visitlog.check_in_time is not None
        except:
            return False

    @property
    def is_checked_out(self):
        """Check if the visitor has checked out"""
        try:
            return self.visitlog.check_out_time is not None
        except:
            return False

    @property
    def check_in_time(self):
        """Get check-in time"""
        try:
            return self.visitlog.check_in_time
        except:
            return None

    @property
    def check_out_time(self):
        """Get check-out time"""
        try:
            return self.visitlog.check_out_time
        except:
            return None

    @classmethod
    def expire_pending_requests(cls):
        """Expire pending requests that are past their scheduled time"""
        now = timezone.now()
        expired_requests = cls.objects.filter(
            status='pending',
            scheduled_time__lt=now
        )
        count = expired_requests.count()
        if count > 0:
            expired_requests.update(status='expired')
        return count


class VisitLog(models.Model):
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE)
    visit_request = models.OneToOneField(VisitRequest, on_delete=models.CASCADE)
    check_in_time = models.DateTimeField(blank=True, null=True)
    check_out_time = models.DateTimeField(blank=True, null=True)
    checked_in_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='check_ins'
    )
    checked_out_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='check_outs'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['visit_request'], name='core_visitl_visit_r_7f7fc4_idx'),
            models.Index(fields=['visitor'], name='core_visitl_visitor_4d02be_idx'),
            models.Index(fields=['check_in_time'], name='core_visitl_check_i_cbef8b_idx'),
            models.Index(fields=['check_out_time'], name='core_visitl_check_o_fbf400_idx'),
            models.Index(fields=['checked_in_by'], name='core_visitl_checked_e31dd8_idx'),
            models.Index(fields=['created_at'], name='core_visitl_created_57350e_idx'),
        ]

    def __str__(self):
        return f"{self.visitor.full_name} - {self.visit_request.employee.username}"

    @property
    def duration(self):
        """Calculate the duration of the visit"""
        if self.check_in_time and self.check_out_time:
            return self.check_out_time - self.check_in_time
        elif self.check_in_time:
            return timezone.now() - self.check_in_time
        return None 