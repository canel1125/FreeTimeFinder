from datetime import time, timedelta, datetime
from collections import defaultdict
from django.db.models import Q
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import Group, Availability, Event, GroupAvailability
from .serializers import (
    GroupSerializer, AvailabilitySerializer, EventSerializer, 
    GroupAvailabilitySerializer, GroupMembershipSerializer, JoinGroupSerializer
)


from datetime import time, timedelta, datetime
from collections import defaultdict
from django.db.models import Q
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import Group, Availability, BusyTime, Event, GroupAvailability
from .serializers import (
    GroupSerializer, AvailabilitySerializer, BusyTimeSerializer, EventSerializer, 
    GroupAvailabilitySerializer, GroupMembershipSerializer, JoinGroupSerializer
)


def calculate_group_free_time(group):
    """
    Calculate common FREE time slots for a group based on when NO ONE is busy.
    This is the inverse of availability - we find times when nobody has marked themselves as busy.
    Optimized for better performance.
    """
    GroupAvailability.objects.filter(group=group).delete()
    
    # Get all members including the creator
    members = list(group.members.all())
    if group.creator not in members:
        members.append(group.creator)
    
    total_members = len(members)
    if total_members < 1:
        return

    # Create time slots once (0:00 to 23:30 in 30-minute intervals)
    all_time_slots = []
    current_time = time(0, 0)
    while current_time < time(23, 30):
        next_time = (
            datetime.combine(datetime.today(), current_time) + 
            timedelta(minutes=30)
        ).time()
        all_time_slots.append((current_time, next_time))
        current_time = next_time

    # Process each day
    for day_of_week in range(7):  # 0=Monday to 6=Sunday
        # Get all busy times for all members on this day - single query
        busy_times = BusyTime.objects.filter(
            user__in=members,
            day_of_week=day_of_week
        ).values('start_time', 'end_time')
        
        # Convert to list for faster iteration
        busy_times_list = list(busy_times)
        
        # Batch create free time slots
        free_slots = []
        
        for start_time, end_time in all_time_slots:
            # Check if any member is busy during this slot
            slot_is_free = True
            
            for busy_time in busy_times_list:
                # If the busy time overlaps with our slot, the slot is not free
                if (busy_time['start_time'] < end_time and busy_time['end_time'] > start_time):
                    slot_is_free = False
                    break
            
            # If no one is busy during this slot, it's a free time for the group
            if slot_is_free:
                free_slots.append(
                    GroupAvailability(
                        group=group,
                        day_of_week=day_of_week,
                        start_time=start_time,
                        end_time=end_time,
                        member_count=total_members
                    )
                )
        
        # Batch create all free slots for this day
        if free_slots:
            GroupAvailability.objects.bulk_create(free_slots, ignore_conflicts=True)


class BusyTimeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user's busy times (when they are NOT available)
    """
    serializer_class = BusyTimeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BusyTime.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save()
        # Recalculate group free time for all groups this user is part of
        self.recalculate_user_groups()

    def perform_update(self, serializer):
        serializer.save()
        # Recalculate group free time for all groups this user is part of
        self.recalculate_user_groups()

    def perform_destroy(self, instance):
        instance.delete()
        # Recalculate group free time for all groups this user is part of
        self.recalculate_user_groups()

    def recalculate_user_groups(self):
        """Recalculate free time for all groups this user belongs to"""
        user_groups = Group.objects.filter(
            Q(creator=self.request.user) | Q(members=self.request.user)
        ).distinct()
        
        for group in user_groups:
            calculate_group_free_time(group)

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Clear all busy times for the current user"""
        BusyTime.objects.filter(user=request.user).delete()
        self.recalculate_user_groups()
        return Response({'message': 'All busy times cleared successfully'})

    @action(detail=False, methods=['post'])
    def batch_create(self, request):
        """Create multiple busy times in batch for better performance"""
        busy_times_data = request.data.get('busy_times', [])
        
        if not busy_times_data:
            return Response({'error': 'No busy times data provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Add limit check for safety
        if len(busy_times_data) > 100:
            return Response({'error': 'Too many busy times in one request. Maximum 100 allowed.'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_busy_times = []
        errors = []
        
        for i, busy_time_data in enumerate(busy_times_data):
            try:
                busy_time_data['user'] = request.user.id
                serializer = BusyTimeSerializer(data=busy_time_data, context={'request': request})
                
                if serializer.is_valid():
                    busy_time = serializer.save()
                    created_busy_times.append(busy_time)
                else:
                    errors.append(f"Item {i}: {serializer.errors}")
            except Exception as e:
                errors.append(f"Item {i}: Error creating busy time: {str(e)}")
        
        # Recalculate group free time once after all creations
        self.recalculate_user_groups()
        
        response_data = {
            'message': f'Created {len(created_busy_times)} busy times',
            'created_count': len(created_busy_times),
            'total_requested': len(busy_times_data)
        }
        
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data, status=status.HTTP_201_CREATED if created_busy_times else status.HTTP_400_BAD_REQUEST)


# Keep AvailabilityViewSet for backward compatibility during migration
class AvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Availability.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save()
        # Recalculate group availability for all groups this user is part of
        self.recalculate_user_groups()

    def perform_update(self, serializer):
        serializer.save()
        # Recalculate group availability for all groups this user is part of
        self.recalculate_user_groups()

    def perform_destroy(self, instance):
        instance.delete()
        # Recalculate group availability for all groups this user is part of
        self.recalculate_user_groups()

    def recalculate_user_groups(self):
        """Recalculate availability for all groups this user belongs to"""
        user_groups = Group.objects.filter(
            Q(creator=self.request.user) | Q(members=self.request.user)
        ).distinct()
        
        for group in user_groups:
            calculate_group_free_time(group)

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Clear all availability for the current user"""
        count = self.get_queryset().count()
        self.get_queryset().delete()
        # Recalculate group availability for all groups this user is part of
        self.recalculate_user_groups()
        return Response({'message': f'Deleted {count} availability slots'})


class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Group.objects.filter(
            Q(creator=self.request.user) | Q(members=self.request.user)
        ).distinct()

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the group"""
        group = self.get_object()
        
        # Only creator can add members
        if group.creator != request.user:
            return Response(
                {'error': 'Only group creator can add members'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = GroupMembershipSerializer(data=request.data)
        if serializer.is_valid():
            user_id = serializer.validated_data['user_id']
            user = User.objects.get(id=user_id)
            
            if user in group.members.all():
                return Response(
                    {'error': 'User is already a member'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            group.members.add(user)
            calculate_group_free_time(group)
            
            return Response({'message': f'User {user.username} added to group'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Remove a member from the group"""
        group = self.get_object()
        
        # Only creator can remove members
        if group.creator != request.user:
            return Response(
                {'error': 'Only group creator can remove members'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = GroupMembershipSerializer(data=request.data)
        if serializer.is_valid():
            user_id = serializer.validated_data['user_id']
            user = User.objects.get(id=user_id)
            
            if user not in group.members.all():
                return Response(
                    {'error': 'User is not a member'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            group.members.remove(user)
            calculate_group_free_time(group)
            
            return Response({'message': f'User {user.username} removed from group'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Get common availability for the group"""
        group = self.get_object()
        calculate_group_free_time(group)
        
        common_availability = GroupAvailability.objects.filter(group=group)
        serializer = GroupAvailabilitySerializer(common_availability, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def regenerate_code(self, request, pk=None):
        """Regenerate invite code for the group"""
        group = self.get_object()
        
        # Only creator can regenerate code
        if group.creator != request.user:
            return Response(
                {'error': 'Only group creator can regenerate invite code'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        group.invite_code = group.generate_invite_code()
        group.save()
        
        return Response({
            'message': 'Invite code regenerated successfully',
            'invite_code': group.invite_code
        })

    @action(detail=False, methods=['post'])
    def join(self, request):
        """Join a group using invite code"""
        serializer = JoinGroupSerializer(data=request.data)
        if serializer.is_valid():
            invite_code = serializer.validated_data['invite_code']
            
            try:
                group = Group.objects.get(invite_code=invite_code)
                
                # Check if user is already a member
                if request.user == group.creator:
                    return Response(
                        {'error': 'You are the creator of this group'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if request.user in group.members.all():
                    return Response(
                        {'error': 'You are already a member of this group'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                group.members.add(request.user)
                calculate_group_free_time(group)
                
                return Response({
                    'message': f'Successfully joined group "{group.name}"',
                    'group': GroupSerializer(group).data
                })
                
            except Group.DoesNotExist:
                return Response(
                    {'error': 'Invalid invite code'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Show events from groups the user is a member of
        user_groups = Group.objects.filter(
            Q(creator=self.request.user) | Q(members=self.request.user)
        )
        return Event.objects.filter(group__in=user_groups)

    def perform_create(self, serializer):
        # Ensure user can only create events for groups they belong to
        group = serializer.validated_data['group']
        if (group.creator != self.request.user and 
            self.request.user not in group.members.all()):
            raise serializers.ValidationError(
                "You can only create events for groups you belong to"
            )
        serializer.save(created_by=self.request.user)
