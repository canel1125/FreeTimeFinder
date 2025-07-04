from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Group, Availability, BusyTime, Event, GroupAvailability


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class BusyTimeSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = BusyTime
        fields = ('id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate(self, data):
        # Ensure start_time is before end_time
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("Start time must be before end time")
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        # Use get_or_create to prevent duplicates
        busy_time, created = BusyTime.objects.get_or_create(**validated_data)
        return busy_time


# Keep AvailabilitySerializer for backward compatibility during migration
class AvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = Availability
        fields = ('id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        # Use get_or_create to prevent duplicates
        availability, created = Availability.objects.get_or_create(**validated_data)
        return availability


class GroupSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    invite_code = serializers.CharField(read_only=True)

    class Meta:
        model = Group
        fields = ('id', 'name', 'description', 'creator', 'members', 'member_count', 'invite_code', 'created_at')
        read_only_fields = ('id', 'creator', 'created_at')

    def get_member_count(self, obj):
        return obj.members.count()

    def create(self, validated_data):
        validated_data['creator'] = self.context['request'].user
        return super().create(validated_data)


class EventSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Event
        fields = ('id', 'name', 'description', 'group', 'group_name', 'date', 'start_time', 'end_time', 'created_by', 'created_at')
        read_only_fields = ('id', 'created_by', 'created_at')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class GroupAvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = GroupAvailability
        fields = ('id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'member_count', 'created_at')
        read_only_fields = ('id', 'created_at')


class GroupMembershipSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
        return value


class JoinGroupSerializer(serializers.Serializer):
    invite_code = serializers.CharField(max_length=8)

    def validate_invite_code(self, value):
        try:
            Group.objects.get(invite_code=value.upper())
        except Group.DoesNotExist:
            raise serializers.ValidationError("Invalid invite code")
        return value.upper()
