from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Group(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups')
    members = models.ManyToManyField(User, related_name='schedule_groups', blank=True)
    invite_code = models.CharField(max_length=8, unique=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = self.generate_invite_code()
        super().save(*args, **kwargs)

    def generate_invite_code(self):
        """Generate a unique 8-character invite code"""
        import random
        import string
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not Group.objects.filter(invite_code=code).exists():
                return code

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']


class BusyTime(models.Model):
    """
    Represents times when a user is busy/occupied (not available)
    """
    DAYS_OF_WEEK = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='busy_times')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'day_of_week', 'start_time', 'end_time']
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.user.username} BUSY - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


# Keep the old Availability model for backward compatibility during migration
class Availability(models.Model):
    DAYS_OF_WEEK = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'day_of_week', 'start_time', 'end_time']
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.user.username} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class Event(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='events')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.date}"

    class Meta:
        ordering = ['-date', '-start_time']


class GroupAvailability(models.Model):
    """
    Computed common FREE time slots for a group (when NO ONE is busy)
    """
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='common_availabilities')
    day_of_week = models.IntegerField(choices=BusyTime.DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    member_count = models.IntegerField(default=0)  # Total members considered for this calculation
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['group', 'day_of_week', 'start_time', 'end_time']
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.group.name} FREE - {self.get_day_of_week_display()} {self.start_time}-{self.end_time} ({self.member_count} members)"
