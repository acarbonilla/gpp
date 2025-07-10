from django.core.management.base import BaseCommand
from core.models import VisitRequest
from django.utils import timezone


class Command(BaseCommand):
    help = 'Expire pending visit requests that are past their scheduled time'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be expired without actually expiring them',
        )

    def handle(self, *args, **options):
        now = timezone.now()
        expired_requests = VisitRequest.objects.filter(
            status='pending',
            scheduled_time__lt=now
        )

        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would expire {expired_requests.count()} visit requests'
                )
            )
            for request in expired_requests:
                self.stdout.write(
                    f'  - {request.visitor.full_name if request.visitor else "Unknown"} '
                    f'(scheduled: {request.scheduled_time}, employee: {request.employee.username})'
                )
        else:
            count = expired_requests.count()
            expired_requests.update(status='expired')
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully expired {count} visit requests'
                )
            ) 