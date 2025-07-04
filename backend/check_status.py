#!/usr/bin/env python
"""
Script to check group status.
"""

import os
import sys
import django

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freetimefinder.settings')
django.setup()

from schedules.models import Group, GroupAvailability, Availability
from django.contrib.auth.models import User

def check_group_status():
    """Check the status of groups and their availability"""
    print("=== GROUP STATUS ===")
    print(f"Total Groups: {Group.objects.count()}")
    print(f"Total Group Availabilities: {GroupAvailability.objects.count()}")
    print(f"Total User Availabilities: {Availability.objects.count()}")
    print(f"Total Users: {User.objects.count()}")
    print()
    
    for group in Group.objects.all():
        print(f"Group: {group.name}")
        print(f"  Creator: {group.creator.username}")
        print(f"  Members: {group.members.count()}")
        
        # List all members (including creator)
        all_members = list(group.members.all())
        if group.creator not in all_members:
            all_members.append(group.creator)
        
        print(f"  All participants: {[m.username for m in all_members]} ({len(all_members)} total)")
        
        # Check individual availability
        for member in all_members:
            member_avail = Availability.objects.filter(user=member).count()
            print(f"    {member.username}: {member_avail} availability slots")
        
        # Check group availability
        group_avail = GroupAvailability.objects.filter(group=group).count()
        print(f"  Common availability slots: {group_avail}")
        
        if group_avail > 0:
            print("  Sample common slots:")
            for slot in GroupAvailability.objects.filter(group=group)[:5]:
                print(f"    {slot.get_day_of_week_display()} {slot.start_time}-{slot.end_time} ({slot.member_count} members)")
        
        print()

if __name__ == '__main__':
    check_group_status()
