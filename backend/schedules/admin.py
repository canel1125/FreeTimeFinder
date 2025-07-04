from django.contrib import admin
from .models import Group, Availability, Event, GroupAvailability


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'creator', 'created_at', 'member_count')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    filter_horizontal = ('members',)

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = 'Members'


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ('user', 'day_of_week', 'start_time', 'end_time', 'created_at')
    list_filter = ('day_of_week', 'created_at')
    search_fields = ('user__username', 'user__email')


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('name', 'group', 'date', 'start_time', 'end_time', 'created_by')
    list_filter = ('date', 'created_at')
    search_fields = ('name', 'description', 'group__name')


@admin.register(GroupAvailability)
class GroupAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('group', 'day_of_week', 'start_time', 'end_time', 'member_count')
    list_filter = ('day_of_week', 'created_at')
    search_fields = ('group__name',)
