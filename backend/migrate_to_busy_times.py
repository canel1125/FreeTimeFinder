#!/usr/bin/env python
"""
Migration script to help users understand the new busy time system.
This script provides information about the change from availability-based to busy-time-based scheduling.
"""

import os
import sys
import django

# Configure Django settings
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freetimefinder.settings')
django.setup()

from django.contrib.auth.models import User
from schedules.models import Availability, BusyTime, Group
from schedules.views import calculate_group_free_time


def main():
    print("=" * 60)
    print("🔄 FreeTimeFinder - System Logic Update")
    print("=" * 60)
    print()
    print("IMPORTANT SYSTEM CHANGE:")
    print("------------------------")
    print("✅ The system now works with BUSY TIMES instead of available times")
    print("✅ Users mark when they are BUSY/OCCUPIED")
    print("✅ Free times are calculated as when NO ONE is busy")
    print("✅ This provides more accurate group coordination")
    print()
    
    # Get current statistics
    total_users = User.objects.count()
    users_with_availability = User.objects.filter(availabilities__isnull=False).distinct().count()
    users_with_busy_times = User.objects.filter(busy_times__isnull=False).distinct().count()
    total_groups = Group.objects.count()
    
    print("📊 CURRENT SYSTEM STATUS:")
    print(f"   👥 Total Users: {total_users}")
    print(f"   📅 Users with old availability data: {users_with_availability}")
    print(f"   ⏰ Users with new busy time data: {users_with_busy_times}")
    print(f"   👥 Total Groups: {total_groups}")
    print()
    
    print("🚀 NEW WORKFLOW:")
    print("   1. Go to 'My Busy Times' in the navigation")
    print("   2. Mark time slots when you are BUSY (meetings, work, etc.)")
    print("   3. The system automatically calculates when everyone is FREE")
    print("   4. Groups will show common free time slots")
    print()
    
    print("🔧 TECHNICAL DETAILS:")
    print("   • New API endpoint: /api/busy-times/")
    print("   • Old endpoint still available: /api/availabilities/")
    print("   • Groups now show 'Common Free Time' instead of 'Common Available Time'")
    print("   • Red cells = Busy, Green cells = Free for everyone")
    print()
    
    # Recalculate all group free times
    print("🔄 Recalculating group free times...")
    groups_updated = 0
    for group in Group.objects.all():
        try:
            calculate_group_free_time(group)
            groups_updated += 1
        except Exception as e:
            print(f"   ⚠️  Error updating group '{group.name}': {e}")
    
    print(f"   ✅ Updated {groups_updated} groups")
    print()
    
    print("✅ MIGRATION COMPLETE!")
    print()
    print("📝 NEXT STEPS FOR USERS:")
    print("   1. Visit the app at http://localhost:3000")
    print("   2. Navigate to 'My Busy Times'")
    print("   3. Mark your busy/occupied time slots")
    print("   4. Check your groups to see common free times")
    print()
    print("=" * 60)


if __name__ == "__main__":
    main()
