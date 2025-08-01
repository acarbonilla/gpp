from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone
from core.models import VisitRequest, VisitLog, Visitor
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fix timezone-related issues in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force the timezone fix even if no issues are detected',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting timezone fix process...'))
        
        try:
            # Set MySQL timezone to match Django settings
            with connection.cursor() as cursor:
                cursor.execute("SET time_zone = '+08:00'")
                self.stdout.write(self.style.SUCCESS('Set MySQL timezone to +08:00'))
                
                # Check if timezone tables exist
                cursor.execute("SHOW TABLES LIKE 'time_zone%'")
                timezone_tables = cursor.fetchall()
                
                if not timezone_tables:
                    self.stdout.write(
                        self.style.WARNING(
                            'MySQL timezone tables not found. '
                            'Consider installing them for better timezone support.'
                        )
                    )
            
            # Test query to check for datetime issues
            try:
                VisitRequest.objects.first()
                self.stdout.write(self.style.SUCCESS('No datetime issues detected in VisitRequest'))
            except ValueError as e:
                if "invalid datetime value" in str(e).lower():
                    self.stdout.write(self.style.ERROR(f'Datetime issue detected: {e}'))
                    if options['force']:
                        self.fix_datetime_issues()
                else:
                    raise e
            
            # Test VisitLog
            try:
                VisitLog.objects.first()
                self.stdout.write(self.style.SUCCESS('No datetime issues detected in VisitLog'))
            except ValueError as e:
                if "invalid datetime value" in str(e).lower():
                    self.stdout.write(self.style.ERROR(f'Datetime issue detected: {e}'))
                    if options['force']:
                        self.fix_datetime_issues()
                else:
                    raise e
            
            # Test Visitor
            try:
                Visitor.objects.first()
                self.stdout.write(self.style.SUCCESS('No datetime issues detected in Visitor'))
            except ValueError as e:
                if "invalid datetime value" in str(e).lower():
                    self.stdout.write(self.style.ERROR(f'Datetime issue detected: {e}'))
                    if options['force']:
                        self.fix_datetime_issues()
                else:
                    raise e
            
            self.stdout.write(self.style.SUCCESS('Timezone fix process completed successfully!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during timezone fix: {e}'))
            raise

    def fix_datetime_issues(self):
        """Fix datetime issues by updating problematic records"""
        self.stdout.write('Attempting to fix datetime issues...')
        
        with connection.cursor() as cursor:
            # Update any NULL or invalid datetime values
            cursor.execute("""
                UPDATE core_visitrequest 
                SET created_at = NOW(), updated_at = NOW() 
                WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00'
            """)
            
            cursor.execute("""
                UPDATE core_visitlog 
                SET created_at = NOW(), updated_at = NOW() 
                WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00'
            """)
            
            cursor.execute("""
                UPDATE core_visitor 
                SET created_at = NOW() 
                WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00'
            """)
            
            self.stdout.write(self.style.SUCCESS('Updated problematic datetime values')) 