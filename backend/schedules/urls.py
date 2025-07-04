from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# New BusyTime endpoint (primary)
router.register(r'busy-times', views.BusyTimeViewSet, basename='busy-time')
# Keep old availability endpoint for backward compatibility
router.register(r'availabilities', views.AvailabilityViewSet, basename='availability')
router.register(r'groups', views.GroupViewSet, basename='group')
router.register(r'events', views.EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
]
