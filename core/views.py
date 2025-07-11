from rest_framework import viewsets, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from datetime import datetime, timedelta
from .models import Visitor, VisitRequest, VisitLog
from .serializers import VisitorSerializer, VisitRequestSerializer, VisitLogSerializer, DashboardMetricSerializer
from django.contrib.auth.models import Group
from django.db.models import Count, Q, Avg
from django.http import HttpResponse
import csv
import json
from io import StringIO
import logging
from django.db.models import Count, Q, Avg


class LoginAPIView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"DEBUG: Login attempt for username: {username}")
        
        if not username or not password:
            return Response({
                'error': 'Please provide both username and password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user is None:
            print(f"DEBUG: Authentication failed for username: {username}")
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        print(f"DEBUG: Authentication successful for user: {user.username}")
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # In a more sophisticated setup, you might want to blacklist the refresh token
            # For now, we'll just return a success response
            return Response({
                'message': 'Successfully logged out'
            })
        except Exception as e:
            return Response({
                'error': 'Logout failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserInfoAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        print(f"DEBUG: UserInfoAPIView.get() called by user: {request.user.username if request.user.is_authenticated else 'Anonymous'}")
        print(f"DEBUG: User authenticated: {request.user.is_authenticated}")
        print(f"DEBUG: Authorization header: {request.headers.get('Authorization', 'Not found')}")
        
        user = request.user
        groups = list(user.groups.values_list('name', flat=True))
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'groups': groups,
        })


class VisitRequestViewSet(viewsets.ModelViewSet):
    queryset = VisitRequest.objects.all()
    serializer_class = VisitRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Automatically expire pending requests that are past their scheduled time
        VisitRequest.expire_pending_requests()
        
        now = timezone.now()
        return VisitRequest.objects.filter(employee=self.request.user, scheduled_time__gte=now)

    def perform_create(self, serializer):
        # Validate that scheduled time is not in the past
        scheduled_time = serializer.validated_data.get('scheduled_time')
        if scheduled_time and scheduled_time < timezone.now():
            raise serializers.ValidationError({
                'scheduled_time': 'Cannot create a visit request for a time that has already passed.'
            })
        
        visit = serializer.save(employee=self.request.user)
        if visit.visit_type == 'scheduled':
            self.send_invite_link(visit)
        
        # Add invitation link to response for easy sharing
        serializer.instance.invitation_link = f"http://localhost:3000/visitor-form/{visit.token}"

    def perform_update(self, serializer):
        # Get the original visit request before update
        original_visit = self.get_object()
        original_purpose = original_visit.purpose
        original_time = original_visit.scheduled_time
        
        # Save the updated visit request
        visit = serializer.save()
        
        # Check if purpose or scheduled_time changed (rescheduling)
        if (original_purpose != visit.purpose or original_time != visit.scheduled_time) and visit.visitor:
            self.send_reschedule_notification(visit, original_purpose, original_time)
        
        # Add invitation link to response for easy sharing
        serializer.instance.invitation_link = f"http://localhost:3000/visitor-form/{visit.token}"

    def send_reschedule_notification(self, visit_request, original_purpose, original_time):
        subject = f"Visit Rescheduled - {visit_request.visitor.full_name}"
        message = f"""
Dear {visit_request.visitor.full_name},

Your visit request has been rescheduled.

Previous Details:
- Purpose: {original_purpose}
- Scheduled Time: {original_time.strftime('%Y-%m-%d %H:%M')}

New Details:
- Host: {visit_request.employee.get_full_name() or visit_request.employee.username}
- Purpose: {visit_request.purpose}
- Scheduled Time: {visit_request.scheduled_time.strftime('%Y-%m-%d %H:%M')}
- Status: {visit_request.get_status_display()}

Please note the changes and plan accordingly. If you have any questions, please contact {visit_request.employee.get_full_name() or visit_request.employee.username}.

Thank you for your understanding.

Best regards,
{visit_request.employee.get_full_name() or visit_request.employee.username}
        """
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [visit_request.visitor.email])
        except Exception as e:
            print(f"Failed to send reschedule notification email: {e}")

    def send_invite_link(self, visit_request):
        link = f"http://localhost:3000/visitor-form/{visit_request.token}"
        subject = f"Visit Invitation from {visit_request.employee.get_full_name() or visit_request.employee.username}"
        message = f"""
Hello,

You have been invited by {visit_request.employee.get_full_name() or visit_request.employee.username} to visit our office.

Visit Details:
- Purpose: {visit_request.purpose}
- Scheduled Time: {visit_request.scheduled_time.strftime('%Y-%m-%d %H:%M')}
- Visit Type: {visit_request.get_visit_type_display()}
- Status: Pending Approval

To complete your visit registration, please click the link below and fill out your visitor information:
{link}

Please complete this form before your scheduled visit time. After submission, your visit request will be reviewed for approval.

Thank you.
        """
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, ["placeholder@email.com"])
        except Exception as e:
            # Log the error but don't fail the request
            print(f"Failed to send email: {e}")
            # In development, you might want to print the link to console
            print(f"Visit invitation link: {link}")


class CompleteVisitorInfoAPIView(APIView):
    def get(self, request, token):
        """Get visit request details for the visitor form"""
        try:
            visit = VisitRequest.objects.get(token=token)
        except VisitRequest.DoesNotExist:
            return Response({'error': 'Invalid or expired link.'}, status=404)

        # Check if visitor info is already completed
        if visit.visitor:
            return Response({
                'error': 'Visitor information has already been submitted for this visit.',
                'visitor_name': visit.visitor.full_name
            }, status=400)

        # Check if visit request is still valid (not expired)
        if visit.scheduled_time < timezone.now():
            # Automatically mark as expired if it's past scheduled time
            if visit.status == 'pending':
                visit.status = 'expired'
                visit.save()
            return Response({'error': 'This visit request has expired.'}, status=400)

        # Check if visit is already approved/rejected
        if visit.status != 'pending':
            return Response({'error': f'This visit request has already been {visit.status}.'}, status=400)

        return Response({
            'visit_details': {
                'purpose': visit.purpose,
                'scheduled_time': visit.scheduled_time,
                'employee_name': visit.employee.get_full_name() or visit.employee.username,
                'visit_type': visit.visit_type
            },
            'message': 'Please fill out your visitor information below.'
        })

    def post(self, request, token):
        try:
            visit = VisitRequest.objects.get(token=token)
        except VisitRequest.DoesNotExist:
            return Response({'error': 'Invalid or expired link.'}, status=404)

        # Check if visitor info is already completed
        if visit.visitor:
            return Response({'error': 'Visitor information has already been submitted for this visit.'}, status=400)

        # Check if visit request is still valid (not expired)
        if visit.scheduled_time < timezone.now():
            return Response({'error': 'This visit request has expired.'}, status=400)

        # Check if visit is already approved/rejected
        if visit.status != 'pending':
            return Response({'error': f'This visit request has already been {visit.status}.'}, status=400)

        serializer = VisitorSerializer(data=request.data)
        if serializer.is_valid():
            visitor = serializer.save(created_by=visit.employee)
            visit.visitor = visitor
            visit.save()
            return Response({
                'message': 'Visitor information submitted successfully.',
                'visit_id': visit.id,
                'scheduled_time': visit.scheduled_time,
                'visitor_name': visitor.full_name
            })
        return Response({
            'error': 'Invalid visitor information.',
            'details': serializer.errors
        }, status=400)


class ApproveVisitAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            visit = VisitRequest.objects.get(pk=pk, employee=request.user)
        except VisitRequest.DoesNotExist:
            return Response({'error': 'Visit not found.'}, status=404)

        if not visit.visitor:
            return Response({'error': 'Visitor information not completed yet.'}, status=400)

        if visit.status != 'pending':
            return Response({'error': f'Visit is already {visit.status}.'}, status=400)

        visit.status = 'approved'
        visit.save()
        
        # Send approval email
        self.send_approval_email(visit)
        
        return Response({
            'message': 'Visit approved successfully.',
            'visit_id': visit.id
        })

    def send_approval_email(self, visit_request):
        subject = f"Visit Approved - {visit_request.visitor.full_name}"
        message = f"""
Dear {visit_request.visitor.full_name},

Your visit request has been approved!

Visit Details:
- Host: {visit_request.employee.get_full_name() or visit_request.employee.username}
- Purpose: {visit_request.purpose}
- Scheduled Time: {visit_request.scheduled_time.strftime('%Y-%m-%d %H:%M')}
- Status: Approved

Please check in at the reception desk when you arrive. You will need to provide your name and the purpose of your visit.

Thank you for your cooperation.

Best regards,
{visit_request.employee.get_full_name() or visit_request.employee.username}
        """
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [visit_request.visitor.email])
        except Exception as e:
            print(f"Failed to send approval email: {e}")


class RejectVisitAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            visit = VisitRequest.objects.get(pk=pk, employee=request.user)
        except VisitRequest.DoesNotExist:
            return Response({'error': 'Visit not found.'}, status=404)

        if visit.status != 'pending':
            return Response({'error': f'Visit is already {visit.status}.'}, status=400)

        visit.status = 'rejected'
        visit.save()
        
        # Send rejection email only if visitor info exists
        if visit.visitor:
            self.send_rejection_email(visit)
        
        return Response({'message': 'Visit rejected and notification sent to visitor.'})

    def send_rejection_email(self, visit_request):
        subject = f"Visit Request Update - {visit_request.visitor.full_name}"
        message = f"""
Dear {visit_request.visitor.full_name},

We regret to inform you that your visit request has been declined.

Visit Details:
- Host: {visit_request.employee.get_full_name() or visit_request.employee.username}
- Purpose: {visit_request.purpose}
- Scheduled Time: {visit_request.scheduled_time.strftime('%Y-%m-%d %H:%M')}
- Status: Rejected

Please contact {visit_request.employee.get_full_name() or visit_request.employee.username} for more information.

Thank you for your understanding.

Best regards,
{visit_request.employee.get_full_name() or visit_request.employee.username}
        """
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [visit_request.visitor.email])
        except Exception as e:
            print(f"Failed to send rejection email: {e}")


class PendingVisitsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all pending visits for the authenticated employee"""
        try:
            print(f"User: {request.user.username}")
            print(f"User authenticated: {request.user.is_authenticated}")
            
            pending_visits = VisitRequest.objects.filter(
                employee=request.user,
                status='pending',
                visitor__isnull=False  # Only visits with completed visitor info
            ).select_related('visitor').order_by('-created_at')
            
            print(f"Found {pending_visits.count()} pending visits")
            
            serializer = VisitRequestSerializer(pending_visits, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in PendingVisitsAPIView: {e}")
            return Response({'error': str(e)}, status=500)


class VisitLogViewSet(viewsets.ModelViewSet):
    queryset = VisitLog.objects.all()
    serializer_class = VisitLogSerializer


class IsLobbyAttendant(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.groups.filter(name='lobby_attendant').exists()


class CreateWalkInVisitAPIView(APIView):
    permission_classes = [IsAuthenticated, IsLobbyAttendant]
    
    def post(self, request):
        """Create a walk-in visit with visitor information"""
        try:
            # Extract visitor data
            visitor_data = {
                'full_name': request.data.get('full_name'),
                'email': request.data.get('email'),
                'contact': request.data.get('contact'),
                'address': request.data.get('address'),
            }
            
            # Extract visit data
            visit_data = {
                'purpose': request.data.get('purpose', 'Walk-in visit'),  # Default purpose for walk-ins
                'scheduled_time': request.data.get('scheduled_time'),
                'visit_type': 'walkin',
            }
            
            # Validate required fields
            if not visitor_data['full_name'] or not visitor_data['email']:
                return Response({
                    'error': 'Visitor name and email are required.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create visitor
            visitor_serializer = VisitorSerializer(data=visitor_data)
            if not visitor_serializer.is_valid():
                return Response({
                    'error': 'Invalid visitor information.',
                    'details': visitor_serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            visitor = visitor_serializer.save(created_by=request.user)
            
            # Create visit request (approved immediately for walk-ins)
            # Ensure proper timezone handling for scheduled_time
            if visit_data['scheduled_time']:
                # If scheduled_time is provided, make it timezone-aware
                from django.utils.dateparse import parse_datetime
                scheduled_time = parse_datetime(visit_data['scheduled_time'])
                if scheduled_time and timezone.is_naive(scheduled_time):
                    scheduled_time = timezone.make_aware(scheduled_time)
            else:
                scheduled_time = timezone.now()
            
            visit_request = VisitRequest.objects.create(
                employee=request.user,  # Lobby attendant becomes the host
                visitor=visitor,
                purpose=visit_data['purpose'],
                scheduled_time=scheduled_time,
                status='approved',  # Walk-ins are approved immediately
                visit_type='walkin'
            )
            
            return Response({
                'message': 'Walk-in visit created successfully.',
                'visit_id': visit_request.id,
                'visitor_id': visitor.id,
                'visitor_name': visitor.full_name,
                'purpose': visit_request.purpose,
                'scheduled_time': visit_request.scheduled_time,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating walk-in visit: {e}")
            return Response({
                'error': 'Failed to create walk-in visit.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TodayVisitorsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsLobbyAttendant]
    
    def get(self, request):
        """Get all approved visitors for today"""
        print("DEBUG: TodayVisitorsAPIView.get() called")
        today = timezone.now().date()
        
        # Debug: Print today's date
        print(f"Today's date: {today}")
        
        # Get all approved visits for today
        # Use a more robust date comparison that handles timezone issues
        today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        today_end = timezone.make_aware(datetime.combine(today, datetime.max.time()))
        
        print(f"Today start: {today_start}")
        print(f"Today end: {today_end}")
        
        # Get all approved visits for today (use range for robust timezone handling)
        today_visits = VisitRequest.objects.filter(
            status='approved',
            scheduled_time__range=(today_start, today_end),
            visitor__isnull=False
        ).select_related('visitor', 'employee')
        
        print(f"Found {today_visits.count()} approved visits for today/tomorrow")
        
        # Debug: Print all visits found
        for visit in today_visits:
            print(f"Visit ID: {visit.id}, Status: {visit.status}, Type: {visit.visit_type}, Visitor: {visit.visitor.full_name}, Scheduled: {visit.scheduled_time}")
        
        visitors_data = []
        for visit in today_visits:
            # Get visit log if it exists
            try:
                visit_log = VisitLog.objects.get(visit_request=visit)
                is_checked_in = visit_log.check_in_time is not None
                check_in_time = visit_log.check_in_time
                is_checked_out = visit_log.check_out_time is not None
                check_out_time = visit_log.check_out_time
            except VisitLog.DoesNotExist:
                is_checked_in = False
                check_in_time = None
                is_checked_out = False
                check_out_time = None
            
            visitors_data.append({
                'visit_id': visit.id,
                'visitor_id': visit.visitor.id,
                'visitor_name': visit.visitor.full_name,
                'visitor_email': visit.visitor.email,
                'host_name': visit.employee.get_full_name() or visit.employee.username,
                'purpose': visit.purpose,
                'scheduled_time': visit.scheduled_time,
                'visit_type': visit.visit_type,
                'status': visit.status,  # Add status field
                'is_checked_in': is_checked_in,
                'check_in_time': check_in_time,
                'is_checked_out': is_checked_out,
                'check_out_time': check_out_time,
            })
        
        print(f"DEBUG: Returning {len(visitors_data)} visitors")
        print(f"DEBUG: Response data: {visitors_data}")
        return Response(visitors_data)


class VisitLogCheckInAPIView(APIView):
    permission_classes = [IsAuthenticated, IsLobbyAttendant]

    def post(self, request):
        visitor_id = request.data.get('visitor_id')
        if not visitor_id:
            return Response({'error': 'Visitor ID is required.'}, status=400)
        
        try:
            # Find the approved visit for today or tomorrow with this visitor
            today = timezone.now().date()
            from datetime import timedelta
            visit = VisitRequest.objects.filter(
                visitor_id=visitor_id,
                status='approved',
                scheduled_time__date__in=[today, today + timedelta(days=1)]
            ).order_by('scheduled_time').first()
            if not visit:
                return Response({'error': 'No approved visit found for this visitor today.'}, status=404)
        except VisitRequest.DoesNotExist:
            return Response({'error': 'No approved visit found for this visitor today.'}, status=404)

        # Check if already checked in
        if VisitLog.objects.filter(visit_request=visit, check_in_time__isnull=False).exists():
            return Response({'error': 'Visitor already checked in.'}, status=400)

        # Check if visit has expired (only for scheduled visits, not walk-ins)
        if visit.visit_type == 'scheduled' and visit.scheduled_time < timezone.now():
            return Response({'error': 'Visit has expired.'}, status=400)

        # Create or get visit log entry
        visit_log, created = VisitLog.objects.get_or_create(
            visit_request=visit,
            defaults={'visitor': visit.visitor}
        )

        # Log the check-in
        visit_log.check_in_time = timezone.now()
        visit_log.checked_in_by = request.user
        visit_log.save()
        
        return Response({
            'message': 'Visitor checked in successfully.',
            'visitor': {
                'name': visit.visitor.full_name,
                'email': visit.visitor.email,
            },
            'visit': {
                'purpose': visit.purpose,
                'scheduled_time': visit.scheduled_time,
            },
            'check_in_time': visit_log.check_in_time
        })


class VisitLogCheckOutAPIView(APIView):
    permission_classes = [IsAuthenticated, IsLobbyAttendant]

    def post(self, request):
        visitor_id = request.data.get('visitor_id')
        if not visitor_id:
            return Response({'error': 'Visitor ID is required.'}, status=400)
        
        try:
            # Find the visit log for this visitor
            visit_log = VisitLog.objects.get(
                visitor_id=visitor_id,
                check_in_time__isnull=False,
                check_out_time__isnull=True
            )
        except VisitLog.DoesNotExist:
            return Response({'error': 'No active visit found for this visitor.'}, status=404)

        # Log the check-out
        visit_log.check_out_time = timezone.now()
        visit_log.checked_out_by = request.user
        visit_log.save()
        
        return Response({
            'message': 'Visitor checked out successfully.',
            'visitor': {
                'name': visit_log.visitor.full_name,
                'email': visit_log.visitor.email,
            },
            'check_out_time': visit_log.check_out_time
        })


class MyVisitorsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all approved visits for this employee
        visits = VisitRequest.objects.filter(
            employee=request.user,
            status='approved',
            visitor__isnull=False
        ).select_related('visitor')

        data = []
        for visit in visits:
            try:
                visit_log = VisitLog.objects.get(visit_request=visit)
                is_checked_in = visit_log.check_in_time is not None
                check_in_time = visit_log.check_in_time
                is_checked_out = visit_log.check_out_time is not None
                check_out_time = visit_log.check_out_time
            except VisitLog.DoesNotExist:
                is_checked_in = False
                check_in_time = None
                is_checked_out = False
                check_out_time = None

            data.append({
                'visit_id': visit.id,
                'visitor_name': visit.visitor.full_name,
                'visitor_email': visit.visitor.email,
                'purpose': visit.purpose,
                'scheduled_time': visit.scheduled_time,
                'is_checked_in': is_checked_in,
                'check_in_time': check_in_time,
                'is_checked_out': is_checked_out,
                'check_out_time': check_out_time,
            })
        return Response(data)


class DashboardMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            today = timezone.now().date()
            
            if user.groups.filter(name='lobby_attendant').exists():
                # Lobby attendant metrics
                total_visitors = VisitRequest.objects.filter(
                    status='approved',
                    scheduled_time__date=today
                ).count()
                
                checked_in = VisitLog.objects.filter(
                    visit_request__status='approved',
                    visit_request__scheduled_time__date=today,
                    check_in_time__isnull=False,
                    check_out_time__isnull=True
                ).count()
                
                pending_checkin = VisitRequest.objects.filter(
                    status='approved',
                    scheduled_time__date=today
                ).exclude(
                    visitlog__isnull=False
                ).count()
                
                checked_out = VisitLog.objects.filter(
                    visit_request__status='approved',
                    visit_request__scheduled_time__date=today,
                    check_out_time__isnull=False
                ).count()
                
                metrics = [
                    {
                        'label': 'Total Visitors Today',
                        'value': total_visitors,
                        'icon': 'UserGroupIcon',
                        'color': 'blue'
                    },
                    {
                        'label': 'Checked In',
                        'value': checked_in,
                        'icon': 'ClipboardDocumentListIcon',
                        'color': 'green'
                    },
                    {
                        'label': 'Pending Check-in',
                        'value': pending_checkin,
                        'icon': 'ClockIcon',
                        'color': 'yellow'
                    },
                    {
                        'label': 'Checked Out',
                        'value': checked_out,
                        'icon': 'ClockIcon',
                        'color': 'gray'
                    },
                ]
            else:
                # Employee metrics
                total_requests = VisitRequest.objects.filter(employee=user).count()
                
                pending_approvals = VisitRequest.objects.filter(
                    employee=user,
                    status='pending',
                    visitor__isnull=False
                ).count()
                
                active_visitors = VisitRequest.objects.filter(
                    employee=user,
                    status='approved',
                    visitor__isnull=False,
                    visitlog__check_in_time__isnull=False,
                    visitlog__check_out_time__isnull=True
                ).count()
                
                metrics = [
                    {
                        'label': 'Total Visit Requests',
                        'value': total_requests,
                        'icon': 'ClipboardDocumentListIcon',
                        'color': 'blue'
                    },
                    {
                        'label': 'Pending Approvals',
                        'value': pending_approvals,
                        'icon': 'ClockIcon',
                        'color': 'yellow'
                    },
                    {
                        'label': 'Active Visitors',
                        'value': active_visitors,
                        'icon': 'UserGroupIcon',
                        'color': 'green'
                    },
                ]
            
            serializer = DashboardMetricSerializer(metrics, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': 'Failed to load dashboard metrics',
                'detail': str(e)
            }, status=500)


class RecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            today = timezone.now().date()
            
            activities = []
            
            if user.groups.filter(name='lobby_attendant').exists():
                # Lobby attendant activities
                # Recent check-ins
                recent_checkins = VisitLog.objects.filter(
                    check_in_time__date=today,
                    checked_in_by=user
                ).select_related('visit_request__visitor', 'visit_request__employee').order_by('-check_in_time')[:5]
                
                for checkin in recent_checkins:
                    activities.append({
                        'id': f"checkin_{checkin.id}",
                        'type': 'checkin',
                        'message': f"Checked in visitor {checkin.visit_request.visitor.full_name}",
                        'details': f"Host: {checkin.visit_request.employee.get_full_name() or checkin.visit_request.employee.username}",
                        'time': checkin.check_in_time,
                        'icon': 'UserGroupIcon',
                        'color': 'green'
                    })
                
                # Recent check-outs
                recent_checkouts = VisitLog.objects.filter(
                    check_out_time__date=today,
                    checked_out_by=user
                ).select_related('visit_request__visitor', 'visit_request__employee').order_by('-check_out_time')[:5]
                
                for checkout in recent_checkouts:
                    activities.append({
                        'id': f"checkout_{checkout.id}",
                        'type': 'checkout',
                        'message': f"Checked out visitor {checkout.visit_request.visitor.full_name}",
                        'details': f"Host: {checkout.visit_request.employee.get_full_name() or checkout.visit_request.employee.username}",
                        'time': checkout.check_out_time,
                        'icon': 'ClockIcon',
                        'color': 'gray'
                    })
                
                # Recent walk-in registrations
                recent_walkins = VisitRequest.objects.filter(
                    visit_type='walkin',
                    created_at__date=today,
                    employee=user
                ).select_related('visitor').order_by('-created_at')[:5]
                
                for walkin in recent_walkins:
                    activities.append({
                        'id': f"walkin_{walkin.id}",
                        'type': 'walkin',
                        'message': f"Registered walk-in visitor {walkin.visitor.full_name if walkin.visitor else 'Unknown'}",
                        'details': f"Purpose: {walkin.purpose}",
                        'time': walkin.created_at,
                        'icon': 'PlusIcon',
                        'color': 'blue'
                    })
                
            else:
                # Employee activities - make queries more inclusive
                # Recent visit requests created (last 7 days instead of just today)
                recent_requests = VisitRequest.objects.filter(
                    employee=user,
                    created_at__gte=timezone.now() - timedelta(days=7)
                ).select_related('visitor').order_by('-created_at')[:5]
                
                for visit_request in recent_requests:
                    visitor_name = visit_request.visitor.full_name if visit_request.visitor else 'pending visitor'
                    activities.append({
                        'id': f"request_{visit_request.id}",
                        'type': 'request',
                        'message': f"Created visit request for {visitor_name}",
                        'details': f"Purpose: {visit_request.purpose}",
                        'time': visit_request.created_at,
                        'icon': 'PlusIcon',
                        'color': 'blue'
                    })
                
                # Recent approvals (last 7 days)
                recent_approvals = VisitRequest.objects.filter(
                    employee=user,
                    status='approved',
                    updated_at__gte=timezone.now() - timedelta(days=7)
                ).select_related('visitor').order_by('-updated_at')[:5]
                
                for approval in recent_approvals:
                    visitor_name = approval.visitor.full_name if approval.visitor else 'Unknown'
                    activities.append({
                        'id': f"approval_{approval.id}",
                        'type': 'approval',
                        'message': f"Approved visit for {visitor_name}",
                        'details': f"Purpose: {approval.purpose}",
                        'time': approval.updated_at,
                        'icon': 'CheckCircleIcon',
                        'color': 'green'
                    })
                
                # Recent visitor registrations (last 7 days)
                recent_registrations_qs = VisitRequest.objects.filter(
                    employee=user,
                    visitor__isnull=False
                ).select_related('visitor')

                recent_registrations = [
                    r for r in recent_registrations_qs
                    if r.visitor and r.visitor.created_at >= timezone.now() - timedelta(days=7)
                ]
                recent_registrations = sorted(recent_registrations, key=lambda r: r.visitor.created_at, reverse=True)[:5]

                for registration in recent_registrations:
                    activities.append({
                        'id': f"registration_{registration.visitor.id}",
                        'type': 'registration',
                        'message': f"Visitor {registration.visitor.full_name} completed registration",
                        'details': f"Purpose: {registration.purpose}",
                        'time': registration.visitor.created_at,
                        'icon': 'UserGroupIcon',
                        'color': 'green'
                    })
                
                # Recent rejections (last 7 days)
                recent_rejections = VisitRequest.objects.filter(
                    employee=user,
                    status='rejected',
                    updated_at__gte=timezone.now() - timedelta(days=7)
                ).select_related('visitor').order_by('-updated_at')[:5]
                
                for rejection in recent_rejections:
                    visitor_name = rejection.visitor.full_name if rejection.visitor else 'Unknown'
                    activities.append({
                        'id': f"rejection_{rejection.id}",
                        'type': 'rejection',
                        'message': f"Rejected visit for {visitor_name}",
                        'details': f"Purpose: {rejection.purpose}",
                        'time': rejection.updated_at,
                        'icon': 'XCircleIcon',
                        'color': 'red'
                    })
            
            # Sort all activities by time (most recent first)
            activities.sort(key=lambda x: x['time'], reverse=True)

            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            total_activities = len(activities)
            total_pages = (total_activities + page_size - 1) // page_size
            start = (page - 1) * page_size
            end = start + page_size
            paginated_activities = activities[start:end]

            # Format time for display
            for activity in paginated_activities:
                time_diff = timezone.now() - activity['time']
                if time_diff.days > 0:
                    activity['time_display'] = f"{time_diff.days} day{'s' if time_diff.days != 1 else ''} ago"
                elif time_diff.seconds > 3600:
                    hours = time_diff.seconds // 3600
                    activity['time_display'] = f"{hours} hour{'s' if hours != 1 else ''} ago"
                elif time_diff.seconds > 60:
                    minutes = time_diff.seconds // 60
                    activity['time_display'] = f"{minutes} minute{'s' if minutes != 1 else ''} ago"
                else:
                    activity['time_display'] = "Just now"

            return Response({
                'count': total_activities,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages,
                'results': paginated_activities
            })
            
        except Exception as e:
            return Response({
                'error': 'Failed to load recent activities',
                'detail': str(e)
            }, status=500)


class CancelVisitAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            visit = VisitRequest.objects.get(pk=pk, employee=request.user)
        except VisitRequest.DoesNotExist:
            return Response({'error': 'Visit not found.'}, status=404)

        if visit.status != 'approved':
            return Response({'error': 'Only approved visits can be canceled.'}, status=400)

        visit.status = 'canceled'
        visit.save()

        # Send cancellation email to visitor if exists
        if visit.visitor:
            subject = f"Visit Canceled - {visit.visitor.full_name}"
            message = f"""
Dear {visit.visitor.full_name},

Your visit scheduled for {visit.scheduled_time.strftime('%Y-%m-%d %H:%M')} has been canceled by {visit.employee.get_full_name() or visit.employee.username}.

If you have questions, please contact your host.

Thank you.
            """
            try:
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [visit.visitor.email])
            except Exception as e:
                print(f"Failed to send cancellation email: {e}")

        return Response({'message': 'Visit canceled successfully.'})

class NoShowVisitAPIView(APIView):
    permission_classes = [IsAuthenticated, IsLobbyAttendant]

    def post(self, request, pk):
        try:
            visit = VisitRequest.objects.get(pk=pk)
        except VisitRequest.DoesNotExist:
            return Response({'error': 'Visit not found.'}, status=404)

        if visit.status != 'approved':
            return Response({'error': 'Only approved visits can be marked as no show.'}, status=400)

        visit.status = 'no_show'
        visit.save()

        # Send no show email to employee and visitor if exists
        subject = f"Visit Marked as No Show - {visit.purpose}"
        message = f"""
Dear {visit.employee.get_full_name() or visit.employee.username},

The visit scheduled for {visit.scheduled_time.strftime('%Y-%m-%d %H:%M')} with visitor {visit.visitor.full_name if visit.visitor else 'Unknown'} was marked as 'No Show' by the lobby attendant.

If this is a mistake, please contact the lobby desk.

Thank you.
        """
        recipients = [visit.employee.email]
        if visit.visitor:
            recipients.append(visit.visitor.email)
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipients)
        except Exception as e:
            print(f"Failed to send no show email: {e}")

        return Response({'message': 'Visit marked as no show.'})


class TodayAllVisitsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsLobbyAttendant]

    def get(self, request):
        from datetime import datetime, timedelta
        from django.utils import timezone
        import pytz

        # Get query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        # Default to current week (Monday to Sunday)
        now = timezone.now()
        # Ensure aware datetime
        if timezone.is_naive(now):
            now = timezone.make_aware(now, timezone.get_current_timezone())
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59)

        # Parse custom dates if provided
        if start_date_str:
            start_of_week = datetime.strptime(start_date_str, '%Y-%m-%d')
            start_of_week = timezone.make_aware(start_of_week, timezone.get_current_timezone())
        if end_date_str:
            end_of_week = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)
            end_of_week = timezone.make_aware(end_of_week, timezone.get_current_timezone())

        visits = VisitRequest.objects.filter(scheduled_time__gte=start_of_week, scheduled_time__lt=end_of_week)
        data = []
        for visit in visits:
            try:
                visitlog = visit.visitlog
            except Exception:
                visitlog = None

            data.append({
                'visit_id': visit.id,
                'visitor_id': visit.visitor.id if visit.visitor else None,
                'visitor_name': visit.visitor.full_name if visit.visitor else '',
                'visitor_email': visit.visitor.email if visit.visitor else '',
                'host_name': visit.employee.get_full_name() or visit.employee.username,
                'purpose': visit.purpose,
                'scheduled_time': visit.scheduled_time,
                'visit_type': visit.visit_type,
                'status': visit.status,
                'is_checked_in': visitlog.check_in_time is not None if visitlog else False,
                'check_in_time': visitlog.check_in_time if visitlog else None,
                'is_checked_out': visitlog.check_out_time is not None if visitlog else False,
                'check_out_time': visitlog.check_out_time if visitlog else None,
            })
        return Response(data)


class ReportsAPIView(APIView):
    permission_classes = [IsAuthenticated, IsLobbyAttendant]
    
    def get(self, request):
        try:
            # Get query parameters
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            status_filter = request.query_params.get('status', 'all')
            employee_filter = request.query_params.get('employee', 'all')
            visit_type_filter = request.query_params.get('visit_type', 'all')
            
            # Convert dates with timezone awareness
            if start_date:
                start_datetime = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
            else:
                start_datetime = timezone.now() - timedelta(days=7)
                
            if end_date:
                end_datetime = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1))
            else:
                end_datetime = timezone.now()
            
            # Base queryset
            queryset = VisitRequest.objects.filter(
                scheduled_time__gte=start_datetime,
                scheduled_time__lte=end_datetime
            )
            
            # Apply filters
            if status_filter != 'all':
                if status_filter == 'checked_in':
                    queryset = queryset.filter(visitlog__check_in_time__isnull=False, visitlog__check_out_time__isnull=True)
                elif status_filter == 'checked_out':
                    queryset = queryset.filter(visitlog__check_out_time__isnull=False)
                else:
                    queryset = queryset.filter(status=status_filter)
            
            if employee_filter != 'all':
                queryset = queryset.filter(employee__username=employee_filter)
            
            if visit_type_filter != 'all':
                queryset = queryset.filter(visit_type=visit_type_filter)
            
            # Calculate metrics
            total_visitors = queryset.count()
            checked_in_visitors = queryset.filter(visitlog__check_in_time__isnull=False, visitlog__check_out_time__isnull=True).count()
            checked_out_visitors = queryset.filter(visitlog__check_out_time__isnull=False).count()
            no_show_visitors = queryset.filter(status='no_show').count()
            pending_visitors = queryset.filter(status='pending').count()
            
            # Calculate average check-in time
            checked_in_requests = queryset.filter(visitlog__check_in_time__isnull=False, visitlog__check_out_time__isnull=True)
            if checked_in_requests.exists():
                # This is a simplified calculation - in a real scenario you'd need more complex logic
                average_check_in_time = "Calculated from check-in data"
            else:
                average_check_in_time = "N/A"
            
            # Get peak hours
            hourly_distribution = {}
            for hour in range(24):
                hourly_distribution[hour] = queryset.filter(
                    scheduled_time__hour=hour
                ).count()
            
            peak_hour = max(hourly_distribution, key=hourly_distribution.get)
            peak_hours = f"{peak_hour}:00"
            
            # Top hosting employees
            top_employees = queryset.values('employee__username').annotate(
                visitor_count=Count('id')
            ).order_by('-visitor_count')[:5]
            
            top_employees_list = [
                {'name': item['employee__username'], 'visitors': item['visitor_count']}
                for item in top_employees
            ]
            
            # Top visit purposes
            top_purposes = queryset.values('purpose').annotate(
                purpose_count=Count('id')
            ).order_by('-purpose_count')[:5]
            
            top_purposes_list = [
                {'purpose': item['purpose'], 'count': item['purpose_count']}
                for item in top_purposes
            ]
            
            # Get detailed visitor list
            visitors_data = []
            for visit in queryset.select_related('visitor', 'employee').order_by('-scheduled_time')[:100]:
                # Get visit log if it exists
                try:
                    visit_log = VisitLog.objects.get(visit_request=visit)
                    check_in_time = visit_log.check_in_time.isoformat() if visit_log.check_in_time else None
                    check_out_time = visit_log.check_out_time.isoformat() if visit_log.check_out_time else None
                except VisitLog.DoesNotExist:
                    check_in_time = None
                    check_out_time = None
                
                visitors_data.append({
                    'visit_id': visit.id,
                    'visitor_name': visit.visitor.full_name if visit.visitor else 'Unknown',
                    'employee_name': visit.employee.username,
                    'scheduled_time': visit.scheduled_time.isoformat(),
                    'status': visit.status,
                    'check_in_time': check_in_time,
                    'check_out_time': check_out_time,
                    'purpose': visit.purpose,
                    'visit_type': visit.visit_type
                })
            
            return Response({
                'totalVisitors': total_visitors,
                'checkedInVisitors': checked_in_visitors,
                'checkedOutVisitors': checked_out_visitors,
                'noShowVisitors': no_show_visitors,
                'pendingVisitors': pending_visitors,
                'averageCheckInTime': average_check_in_time,
                'peakHours': peak_hours,
                'topEmployees': top_employees_list,
                'topPurposes': top_purposes_list,
                'visitors': visitors_data
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to generate report: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReportsDownloadAPIView(APIView):
    permission_classes = [IsAuthenticated, IsLobbyAttendant]
    
    
    def get(self, request):
        print("DEBUG: ReportsDownloadAPIView.get() called")  # Debug log
        print(f"DEBUG: Full URL: {request.build_absolute_uri()}")  # Debug log
        print(f"DEBUG: Query params: {request.query_params}")  # Debug log
        try:
            # Get query parameters
            format_type = request.query_params.get('format', 'csv')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            status_filter = request.query_params.get('status', 'all')
            employee_filter = request.query_params.get('employee', 'all')
            visit_type_filter = request.query_params.get('visit_type', 'all')
            
            print(f"DEBUG: format_type={format_type}, start_date={start_date}, end_date={end_date}")  # Debug log
            
            # Convert dates with timezone awareness
            if start_date:
                start_datetime = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
            else:
                start_datetime = timezone.now() - timedelta(days=7)
                
            if end_date:
                end_datetime = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1))
            else:
                end_datetime = timezone.now()
            
            # Base queryset
            queryset = VisitRequest.objects.filter(
                scheduled_time__gte=start_datetime,
                scheduled_time__lte=end_datetime
            ).select_related('visitor', 'employee')
            
            # Apply filters
            if status_filter != 'all':
                if status_filter == 'checked_in':
                    queryset = queryset.filter(visitlog__check_in_time__isnull=False, visitlog__check_out_time__isnull=True)
                elif status_filter == 'checked_out':
                    queryset = queryset.filter(visitlog__check_out_time__isnull=False)
                else:
                    queryset = queryset.filter(status=status_filter)
            
            if employee_filter != 'all':
                queryset = queryset.filter(employee__username=employee_filter)
            
            if visit_type_filter != 'all':
                queryset = queryset.filter(visit_type=visit_type_filter)
            
            print(f"DEBUG: queryset count = {queryset.count()}")  # Debug log
            
            if format_type == 'csv':
                return self.generate_csv(queryset)
            elif format_type == 'excel':
                return self.generate_excel(queryset)
            elif format_type == 'pdf':
                return self.generate_pdf(queryset)
            else:
                return Response({'error': 'Unsupported format'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"DEBUG: Exception in ReportsDownloadAPIView: {e}")  # Debug log
            return Response({
                'error': f'Failed to download report: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generate_csv(self, queryset):
        import logging
        logger = logging.getLogger(__name__)
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="visitor_report.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Visitor Name', 'Employee', 'Scheduled Time', 'Status', 
            'Check-in Time', 'Check-out Time', 'Purpose', 'Visit Type', 'Row Error'
        ])
        
        for visit in queryset.select_related('visitor', 'employee'):
            try:
                # Get visit log if it exists
                try:
                    visit_log = VisitLog.objects.get(visit_request=visit)
                    check_in_time = visit_log.check_in_time.strftime('%Y-%m-%d %H:%M') if visit_log.check_in_time else ''
                    check_out_time = visit_log.check_out_time.strftime('%Y-%m-%d %H:%M') if visit_log.check_out_time else ''
                except VisitLog.DoesNotExist:
                    check_in_time = ''
                    check_out_time = ''
                
                writer.writerow([
                    visit.visitor.full_name if visit.visitor else 'Unknown',
                    visit.employee.username,
                    visit.scheduled_time.strftime('%Y-%m-%d %H:%M'),
                    visit.status,
                    check_in_time,
                    check_out_time,
                    visit.purpose,
                    visit.visit_type,
                    ''
                ])
            except Exception as e:
                logger.error(f"Error writing row for VisitRequest id={visit.id}: {e}")
                writer.writerow([
                    getattr(visit.visitor, 'full_name', 'Unknown'),
                    getattr(visit.employee, 'username', 'Unknown'),
                    getattr(visit, 'scheduled_time', ''),
                    getattr(visit, 'status', ''),
                    '', '', '', '',
                    f'Error: {e}'
                ])
        
        return response
    
    def generate_excel(self, queryset):
        # For now, return CSV as Excel (you can implement proper Excel generation later)
        return self.generate_csv(queryset)
    
    def generate_pdf(self, queryset):
        # For now, return CSV as PDF (you can implement proper PDF generation later)
        return self.generate_csv(queryset)
