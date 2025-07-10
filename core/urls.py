from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VisitRequestViewSet, 
    VisitLogViewSet, 
    CompleteVisitorInfoAPIView, 
    ApproveVisitAPIView,
    RejectVisitAPIView,
    PendingVisitsAPIView,
    LoginAPIView,
    LogoutAPIView,
    UserInfoAPIView,
    VisitLogCheckInAPIView,
    TodayVisitorsAPIView,
    TodayAllVisitsAPIView,  # <-- add
    VisitLogCheckOutAPIView,
    CreateWalkInVisitAPIView,
    MyVisitorsAPIView,
    DashboardMetricsView,
    RecentActivityView,
    CancelVisitAPIView,   # <-- add
    NoShowVisitAPIView,  # <-- add
    ReportsAPIView,
    ReportsDownloadAPIView,
)

router = DefaultRouter()
router.register(r'visit-requests', VisitRequestViewSet)
router.register(r'visit-logs', VisitLogViewSet)

urlpatterns = [
    # Reports endpoints (moved to top to avoid conflicts)
    path('reports/download/', ReportsDownloadAPIView.as_view(), name='reports-download'),
    path('reports/', ReportsAPIView.as_view(), name='reports'),
    
    path('visitor-form/<uuid:token>/', CompleteVisitorInfoAPIView.as_view(), name='visitor-form'),
    path('visit-requests/pending/', PendingVisitsAPIView.as_view(), name='pending-visits'),
    path('visit-requests/<int:pk>/approve/', ApproveVisitAPIView.as_view(), name='approve-visit'),
    path('visit-requests/<int:pk>/reject/', RejectVisitAPIView.as_view(), name='reject-visit'),
    path('visit-requests/<int:pk>/cancel/', CancelVisitAPIView.as_view(), name='cancel-visit'),  # <-- add
    path('visit-requests/<int:pk>/no-show/', NoShowVisitAPIView.as_view(), name='no-show-visit'),  # <-- add
    
    # Authentication endpoints
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/logout/', LogoutAPIView.as_view(), name='logout'),
    path('auth/user/', UserInfoAPIView.as_view(), name='user-info'),
    
    # Lobby attendant endpoints
    path('lobby/today-visitors/', TodayVisitorsAPIView.as_view(), name='today-visitors'),
    path('lobby/checkin/', VisitLogCheckInAPIView.as_view(), name='visit-log-checkin'),
    path('lobby/checkout/', VisitLogCheckOutAPIView.as_view(), name='visit-log-checkout'),
    path('lobby/walkin/', CreateWalkInVisitAPIView.as_view(), name='create-walkin-visit'),
    path('my-visitors/', MyVisitorsAPIView.as_view(), name='my-visitors'),
    path('dashboard-metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('recent-activities/', RecentActivityView.as_view(), name='recent-activities'),
    path('lobby/today-all-visits/', TodayAllVisitsAPIView.as_view(), name='today-all-visits'),
    
    # Router URLs (must be last to avoid conflicts)
    path('', include(router.urls)),
]
