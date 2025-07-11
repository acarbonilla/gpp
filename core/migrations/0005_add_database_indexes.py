# Generated manually to add database indexes for performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_add_expired_status'),
    ]

    operations = [
        # Add indexes to Visitor model
        migrations.AddIndex(
            model_name='visitor',
            index=models.Index(fields=['email'], name='core_visitor_email_idx'),
        ),
        migrations.AddIndex(
            model_name='visitor',
            index=models.Index(fields=['full_name'], name='core_visitor_full_name_idx'),
        ),
        migrations.AddIndex(
            model_name='visitor',
            index=models.Index(fields=['created_at'], name='core_visitor_created_at_idx'),
        ),
        
        # Add indexes to VisitRequest model
        migrations.AddIndex(
            model_name='visitrequest',
            index=models.Index(fields=['employee', 'status'], name='core_visitrequest_employee_status_idx'),
        ),
        migrations.AddIndex(
            model_name='visitrequest',
            index=models.Index(fields=['employee', 'scheduled_time'], name='core_visitrequest_employee_scheduled_time_idx'),
        ),
        migrations.AddIndex(
            model_name='visitrequest',
            index=models.Index(fields=['status', 'scheduled_time'], name='core_visitrequest_status_scheduled_time_idx'),
        ),
        migrations.AddIndex(
            model_name='visitrequest',
            index=models.Index(fields=['visitor', 'status'], name='core_visitrequest_visitor_status_idx'),
        ),
        migrations.AddIndex(
            model_name='visitrequest',
            index=models.Index(fields=['scheduled_time', 'status'], name='core_visitrequest_scheduled_time_status_idx'),
        ),
        migrations.AddIndex(
            model_name='visitrequest',
            index=models.Index(fields=['created_at'], name='core_visitrequest_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='visitrequest',
            index=models.Index(fields=['token'], name='core_visitrequest_token_idx'),
        ),
        
        # Add indexes to VisitLog model
        migrations.AddIndex(
            model_name='visitlog',
            index=models.Index(fields=['visit_request'], name='core_visitlog_visit_request_idx'),
        ),
        migrations.AddIndex(
            model_name='visitlog',
            index=models.Index(fields=['visitor'], name='core_visitlog_visitor_idx'),
        ),
        migrations.AddIndex(
            model_name='visitlog',
            index=models.Index(fields=['check_in_time'], name='core_visitlog_check_in_time_idx'),
        ),
        migrations.AddIndex(
            model_name='visitlog',
            index=models.Index(fields=['check_out_time'], name='core_visitlog_check_out_time_idx'),
        ),
        migrations.AddIndex(
            model_name='visitlog',
            index=models.Index(fields=['checked_in_by'], name='core_visitlog_checked_in_by_idx'),
        ),
        migrations.AddIndex(
            model_name='visitlog',
            index=models.Index(fields=['created_at'], name='core_visitlog_created_at_idx'),
        ),
    ] 