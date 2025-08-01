from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Q
from django.core.exceptions import ValidationError
from .models import Visitor, VisitRequest, VisitLog


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'contact', 'created_by', 'created_at', 'visit_count')
    list_filter = ('created_at', 'created_by')
    search_fields = ('full_name', 'email', 'contact', 'address')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Visitor Information', {
            'fields': ('full_name', 'email', 'contact', 'address')
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def visit_count(self, obj):
        """Display the number of visits for this visitor"""
        return obj.visitrequest_set.count()
    visit_count.short_description = 'Total Visits'
    
    def get_queryset(self, request):
        """Optimize queryset with related data and handle timezone issues"""
        try:
            return super().get_queryset(request).select_related('created_by')
        except ValueError as e:
            if "invalid datetime value" in str(e).lower():
                # Handle timezone-related datetime issues
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute("SET time_zone = '+08:00'")
                return super().get_queryset(request).select_related('created_by')
            raise e


class VisitLogInline(admin.TabularInline):
    model = VisitLog
    extra = 0
    readonly_fields = ('check_in_time', 'check_out_time', 'checked_in_by', 'checked_out_by', 'created_at')
    can_delete = False
    fields = ('visitor', 'check_in_time', 'check_out_time', 'checked_in_by', 'checked_out_by', 'notes')


@admin.register(VisitRequest)
class VisitRequestAdmin(admin.ModelAdmin):
    list_display = ('visitor_name', 'employee', 'purpose_short', 'scheduled_time', 'status', 'visit_type', 'is_expired_display', 'is_checked_in_display')
    list_filter = ('status', 'visit_type', 'scheduled_time', 'created_at', 'employee')
    search_fields = ('visitor__full_name', 'visitor__email', 'employee__username', 'employee__first_name', 'employee__last_name', 'purpose')
    readonly_fields = ('token', 'created_at', 'updated_at', 'is_expired_display', 'is_checked_in_display', 'is_checked_out_display')
    ordering = ('-created_at',)
    # Temporarily disable date_hierarchy to avoid timezone issues
    # date_hierarchy = 'scheduled_time'
    
    fieldsets = (
        ('Visit Information', {
            'fields': ('visitor', 'employee', 'original_employee', 'purpose', 'scheduled_time', 'status', 'visit_type')
        }),
        ('System Information', {
            'fields': ('token', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Status Information', {
            'fields': ('is_expired_display', 'is_checked_in_display', 'is_checked_out_display'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [VisitLogInline]
    
    actions = ['approve_visits', 'reject_visits', 'expire_visits', 'mark_no_show']
    
    def visitor_name(self, obj):
        """Display visitor name with link to visitor admin"""
        if obj.visitor:
            return format_html('<a href="{}">{}</a>', 
                             f'/admin/core/visitor/{obj.visitor.id}/change/', 
                             obj.visitor.full_name)
        return 'No Visitor'
    visitor_name.short_description = 'Visitor'
    visitor_name.admin_order_field = 'visitor__full_name'
    
    def purpose_short(self, obj):
        """Display truncated purpose"""
        return obj.purpose[:50] + '...' if len(obj.purpose) > 50 else obj.purpose
    purpose_short.short_description = 'Purpose'
    
    def is_expired_display(self, obj):
        """Display expired status with color coding"""
        if obj.is_expired:
            return format_html('<span style="color: red;">Expired</span>')
        return format_html('<span style="color: green;">Active</span>')
    is_expired_display.short_description = 'Expired Status'
    
    def is_checked_in_display(self, obj):
        """Display check-in status with color coding"""
        if obj.is_checked_in:
            return format_html('<span style="color: green;">✓ Checked In</span>')
        return format_html('<span style="color: orange;">Not Checked In</span>')
    is_checked_in_display.short_description = 'Check-in Status'
    
    def is_checked_out_display(self, obj):
        """Display check-out status with color coding"""
        if obj.is_checked_out:
            return format_html('<span style="color: blue;">✓ Checked Out</span>')
        elif obj.is_checked_in:
            return format_html('<span style="color: orange;">Still Inside</span>')
        return format_html('<span style="color: gray;">Not Checked In</span>')
    is_checked_out_display.short_description = 'Check-out Status'
    
    def approve_visits(self, request, queryset):
        """Approve selected visit requests"""
        updated = queryset.filter(status='pending').update(status='approved')
        self.message_user(request, f'{updated} visit requests have been approved.')
    approve_visits.short_description = 'Approve selected visit requests'
    
    def reject_visits(self, request, queryset):
        """Reject selected visit requests"""
        updated = queryset.filter(status='pending').update(status='rejected')
        self.message_user(request, f'{updated} visit requests have been rejected.')
    reject_visits.short_description = 'Reject selected visit requests'
    
    def expire_visits(self, request, queryset):
        """Expire selected visit requests"""
        updated = queryset.filter(status='pending').update(status='expired')
        self.message_user(request, f'{updated} visit requests have been expired.')
    expire_visits.short_description = 'Expire selected visit requests'
    
    def mark_no_show(self, request, queryset):
        """Mark selected visit requests as no show"""
        updated = queryset.filter(status='approved').update(status='no_show')
        self.message_user(request, f'{updated} visit requests have been marked as no show.')
    mark_no_show.short_description = 'Mark selected visit requests as no show'
    
    def get_queryset(self, request):
        """Optimize queryset with related data and handle timezone issues"""
        try:
            return super().get_queryset(request).select_related('visitor', 'employee', 'original_employee')
        except ValueError as e:
            if "invalid datetime value" in str(e).lower():
                # Handle timezone-related datetime issues
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute("SET time_zone = '+08:00'")
                return super().get_queryset(request).select_related('visitor', 'employee', 'original_employee')
            raise e


@admin.register(VisitLog)
class VisitLogAdmin(admin.ModelAdmin):
    list_display = ('visitor_name', 'visit_request_link', 'check_in_time', 'check_out_time', 'checked_in_by', 'checked_out_by', 'duration_display')
    list_filter = ('check_in_time', 'check_out_time', 'checked_in_by', 'checked_out_by', 'created_at')
    search_fields = ('visitor__full_name', 'visitor__email', 'visit_request__purpose')
    readonly_fields = ('created_at', 'updated_at', 'duration_display')
    ordering = ('-created_at',)
    # Temporarily disable date_hierarchy to avoid timezone issues
    # date_hierarchy = 'check_in_time'
    
    fieldsets = (
        ('Visit Information', {
            'fields': ('visit_request', 'visitor')
        }),
        ('Check-in Information', {
            'fields': ('check_in_time', 'checked_in_by')
        }),
        ('Check-out Information', {
            'fields': ('check_out_time', 'checked_out_by')
        }),
        ('Additional Information', {
            'fields': ('notes', 'duration_display')
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def visitor_name(self, obj):
        """Display visitor name with link to visitor admin"""
        return format_html('<a href="{}">{}</a>', 
                         f'/admin/core/visitor/{obj.visitor.id}/change/', 
                         obj.visitor.full_name)
    visitor_name.short_description = 'Visitor'
    visitor_name.admin_order_field = 'visitor__full_name'
    
    def visit_request_link(self, obj):
        """Display visit request with link"""
        return format_html('<a href="{}">{}</a>', 
                         f'/admin/core/visitrequest/{obj.visit_request.id}/change/', 
                         f'Visit #{obj.visit_request.id}')
    visit_request_link.short_description = 'Visit Request'
    
    def duration_display(self, obj):
        """Display visit duration"""
        if obj.check_in_time and obj.check_out_time:
            duration = obj.check_out_time - obj.check_in_time
            hours = duration.total_seconds() / 3600
            return f"{hours:.1f} hours"
        elif obj.check_in_time:
            return "Still inside"
        return "Not checked in"
    duration_display.short_description = 'Duration'
    
    def get_queryset(self, request):
        """Optimize queryset with related data and handle timezone issues"""
        try:
            return super().get_queryset(request).select_related('visitor', 'visit_request', 'checked_in_by', 'checked_out_by')
        except ValueError as e:
            if "invalid datetime value" in str(e).lower():
                # Handle timezone-related datetime issues
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute("SET time_zone = '+08:00'")
                return super().get_queryset(request).select_related('visitor', 'visit_request', 'checked_in_by', 'checked_out_by')
            raise e


# Customize admin site
admin.site.site_header = "GatePassPro Administration"
admin.site.site_title = "GatePassPro Admin"
admin.site.index_title = "Welcome to GatePassPro Administration"
