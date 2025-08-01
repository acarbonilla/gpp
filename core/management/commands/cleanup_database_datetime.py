from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone
from core.models import VisitRequest, VisitLog, Visitor
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Clean up problematic datetime values in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be fixed without making changes',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force the cleanup even if no issues are detected',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database datetime cleanup...'))
        
        try:
            # Set MySQL timezone
            with connection.cursor() as cursor:
                cursor.execute("SET time_zone = '+08:00'")
                self.stdout.write(self.style.SUCCESS('Set MySQL timezone to +08:00'))
            
            # Check for problematic datetime values
            self.check_and_fix_datetime_issues(options)
            
            self.stdout.write(self.style.SUCCESS('Database cleanup completed successfully!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during cleanup: {e}'))
            raise

    def check_and_fix_datetime_issues(self, options):
        """Check and fix datetime issues in all tables"""
        
        with connection.cursor() as cursor:
            # Check VisitRequest table
            self.stdout.write('Checking VisitRequest table...')
            
            # Find problematic datetime values
            cursor.execute("""
                SELECT id, created_at, updated_at, scheduled_time 
                FROM core_visitrequest 
                WHERE created_at IS NULL 
                   OR created_at = '0000-00-00 00:00:00'
                   OR updated_at IS NULL 
                   OR updated_at = '0000-00-00 00:00:00'
                   OR scheduled_time IS NULL 
                   OR scheduled_time = '0000-00-00 00:00:00'
            """)
            
            problematic_visit_requests = cursor.fetchall()
            
            if problematic_visit_requests:
                self.stdout.write(
                    self.style.WARNING(f'Found {len(problematic_visit_requests)} problematic VisitRequest records')
                )
                
                if not options['dry_run']:
                    # Fix VisitRequest datetime issues
                    cursor.execute("""
                        UPDATE core_visitrequest 
                        SET created_at = COALESCE(created_at, NOW()),
                            updated_at = COALESCE(updated_at, NOW()),
                            scheduled_time = COALESCE(scheduled_time, NOW())
                        WHERE created_at IS NULL 
                           OR created_at = '0000-00-00 00:00:00'
                           OR updated_at IS NULL 
                           OR updated_at = '0000-00-00 00:00:00'
                           OR scheduled_time IS NULL 
                           OR scheduled_time = '0000-00-00 00:00:00'
                    """)
                    self.stdout.write(self.style.SUCCESS('Fixed VisitRequest datetime issues'))
                else:
                    self.stdout.write('DRY RUN: Would fix VisitRequest datetime issues')
            else:
                self.stdout.write(self.style.SUCCESS('No problematic VisitRequest records found'))
            
            # Check VisitLog table
            self.stdout.write('Checking VisitLog table...')
            
            cursor.execute("""
                SELECT id, created_at, updated_at, check_in_time, check_out_time
                FROM core_visitlog 
                WHERE created_at IS NULL 
                   OR created_at = '0000-00-00 00:00:00'
                   OR updated_at IS NULL 
                   OR updated_at = '0000-00-00 00:00:00'
                   OR (check_in_time IS NOT NULL AND check_in_time = '0000-00-00 00:00:00')
                   OR (check_out_time IS NOT NULL AND check_out_time = '0000-00-00 00:00:00')
            """)
            
            problematic_visit_logs = cursor.fetchall()
            
            if problematic_visit_logs:
                self.stdout.write(
                    self.style.WARNING(f'Found {len(problematic_visit_logs)} problematic VisitLog records')
                )
                
                if not options['dry_run']:
                    # Fix VisitLog datetime issues
                    cursor.execute("""
                        UPDATE core_visitlog 
                        SET created_at = COALESCE(created_at, NOW()),
                            updated_at = COALESCE(updated_at, NOW()),
                            check_in_time = CASE 
                                WHEN check_in_time = '0000-00-00 00:00:00' THEN NULL 
                                ELSE check_in_time 
                            END,
                            check_out_time = CASE 
                                WHEN check_out_time = '0000-00-00 00:00:00' THEN NULL 
                                ELSE check_out_time 
                            END
                        WHERE created_at IS NULL 
                           OR created_at = '0000-00-00 00:00:00'
                           OR updated_at IS NULL 
                           OR updated_at = '0000-00-00 00:00:00'
                           OR (check_in_time IS NOT NULL AND check_in_time = '0000-00-00 00:00:00')
                           OR (check_out_time IS NOT NULL AND check_out_time = '0000-00-00 00:00:00')
                    """)
                    self.stdout.write(self.style.SUCCESS('Fixed VisitLog datetime issues'))
                else:
                    self.stdout.write('DRY RUN: Would fix VisitLog datetime issues')
            else:
                self.stdout.write(self.style.SUCCESS('No problematic VisitLog records found'))
            
            # Check Visitor table
            self.stdout.write('Checking Visitor table...')
            
            cursor.execute("""
                SELECT id, created_at
                FROM core_visitor 
                WHERE created_at IS NULL 
                   OR created_at = '0000-00-00 00:00:00'
            """)
            
            problematic_visitors = cursor.fetchall()
            
            if problematic_visitors:
                self.stdout.write(
                    self.style.WARNING(f'Found {len(problematic_visitors)} problematic Visitor records')
                )
                
                if not options['dry_run']:
                    # Fix Visitor datetime issues
                    cursor.execute("""
                        UPDATE core_visitor 
                        SET created_at = COALESCE(created_at, NOW())
                        WHERE created_at IS NULL 
                           OR created_at = '0000-00-00 00:00:00'
                    """)
                    self.stdout.write(self.style.SUCCESS('Fixed Visitor datetime issues'))
                else:
                    self.stdout.write('DRY RUN: Would fix Visitor datetime issues')
            else:
                self.stdout.write(self.style.SUCCESS('No problematic Visitor records found'))
            
            # Test if the fixes worked
            if not options['dry_run']:
                self.stdout.write('Testing database access...')
                try:
                    VisitRequest.objects.first()
                    VisitLog.objects.first()
                    Visitor.objects.first()
                    self.stdout.write(self.style.SUCCESS('Database access test passed'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Database access test failed: {e}'))
                    raise 