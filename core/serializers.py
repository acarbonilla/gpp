from rest_framework import serializers
from django.utils import timezone
from .models import Visitor, VisitRequest, VisitLog
import re
import email_validator


class VisitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitor
        fields = ['full_name', 'email', 'contact', 'address']
        read_only_fields = ['created_by']
        
    def validate_email(self, value):
        # Enhanced email validation
        if not value or not value.strip():
            raise serializers.ValidationError("Email address is required.")
        
        try:
            # Use email-validator library for comprehensive validation
            email_validator.validate_email(value.strip())
        except email_validator.EmailNotValidError as e:
            raise serializers.ValidationError(f"Please provide a valid email address: {str(e)}")
        
        return value.strip().lower()
    
    def validate_full_name(self, value):
        # Validate full name
        if not value or not value.strip():
            raise serializers.ValidationError("Full name is required.")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters long.")
        
        if len(value.strip()) > 100:
            raise serializers.ValidationError("Full name cannot exceed 100 characters.")
        
        # Check for valid characters (letters, spaces, hyphens, apostrophes)
        if not re.match(r"^[a-zA-Z\s\-'\.]+$", value.strip()):
            raise serializers.ValidationError("Full name can only contain letters, spaces, hyphens, apostrophes, and periods.")
        
        return value.strip()
    
    def validate_contact(self, value):
        # Enhanced contact validation
        if not value or not value.strip():
            return ''  # Allow empty contact numbers
        
        # Remove all non-digit characters for validation
        digits_only = re.sub(r'\D', '', value.strip())
        
        if len(digits_only) < 10:
            raise serializers.ValidationError("Contact number should be at least 10 digits.")
        
        if len(digits_only) > 15:
            raise serializers.ValidationError("Contact number cannot exceed 15 digits.")
        
        return value.strip()
    
    def validate_address(self, value):
        # Validate address if provided
        if value and value.strip():
            if len(value.strip()) > 500:
                raise serializers.ValidationError("Address cannot exceed 500 characters.")
        return value.strip() if value else ''


class VisitRequestSerializer(serializers.ModelSerializer):
    visitor = VisitorSerializer(required=False, read_only=True)
    invitation_link = serializers.SerializerMethodField()
    employee_id = serializers.IntegerField(source='employee.id', read_only=True)

    class Meta:
        model = VisitRequest
        fields = '__all__'
        read_only_fields = ['employee', 'token', 'qr_code_image', 'visitor']
    
    def get_invitation_link(self, obj):
        if hasattr(obj, 'invitation_link'):
            return obj.invitation_link
        from django.conf import settings
        return f"{settings.FRONTEND_URL}/visitor-form/{obj.token}"
    
    def validate(self, data):
        # For updates, check if the visit can be modified
        if self.instance:
            if self.instance.status != 'pending':
                raise serializers.ValidationError("Only pending visits can be modified.")
            
            # Check if scheduled_time is in the future
            if 'scheduled_time' in data and data['scheduled_time'] <= timezone.now():
                raise serializers.ValidationError("Scheduled time must be in the future.")
        
        # For new visits, validate scheduled_time is in the future
        if not self.instance and 'scheduled_time' in data:
            if data['scheduled_time'] <= timezone.now():
                raise serializers.ValidationError("Scheduled time must be in the future.")
        
        # Validate purpose field
        if 'purpose' in data:
            purpose = data['purpose'].strip()
            if not purpose:
                raise serializers.ValidationError("Purpose is required.")
            if len(purpose) < 10:
                raise serializers.ValidationError("Purpose must be at least 10 characters long.")
            if len(purpose) > 1000:
                raise serializers.ValidationError("Purpose cannot exceed 1000 characters.")
        
        # Validate scheduled_time is not too far in the future (e.g., 1 year)
        if 'scheduled_time' in data:
            max_future_date = timezone.now() + timezone.timedelta(days=365)
            if data['scheduled_time'] > max_future_date:
                raise serializers.ValidationError("Scheduled time cannot be more than 1 year in the future.")
        
        return data


class VisitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitLog
        fields = '__all__'


class DashboardMetricSerializer(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.IntegerField()
    icon = serializers.CharField()
    color = serializers.CharField()
