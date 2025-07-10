from rest_framework import serializers
from django.utils import timezone
from .models import Visitor, VisitRequest, VisitLog
import re


class VisitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitor
        fields = ['full_name', 'email', 'contact', 'address']
        read_only_fields = ['created_by']
        
    def validate_email(self, value):
        # Basic email validation
        if not value or '@' not in value:
            raise serializers.ValidationError("Please provide a valid email address.")
        return value
    
    def validate_contact(self, value):
        # Allow empty contact numbers, but validate if provided
        if value and value.strip():  # Only validate if contact is provided and not empty
            # Remove all non-digit characters for validation
            digits_only = re.sub(r'\D', '', value.strip())
            if len(digits_only) < 10:
                raise serializers.ValidationError("Contact number should be at least 10 digits.")
        return value.strip() if value else ''  # Return empty string if no value


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
        return f"http://localhost:3000/visitor-form/{obj.token}"
    
    def validate(self, data):
        # For updates, check if the visit can be modified
        if self.instance:
            if self.instance.status != 'pending':
                raise serializers.ValidationError("Only pending visits can be modified.")
            
            # Check if scheduled_time is in the future
            if 'scheduled_time' in data and data['scheduled_time'] <= timezone.now():
                raise serializers.ValidationError("Scheduled time must be in the future.")
        
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
