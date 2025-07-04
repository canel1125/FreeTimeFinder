#!/usr/bin/env python
"""
Script to recalculate group availability for all existing groups.
Run this after fixing the algorithm.
"""

import os
import sys
import django

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freetimefinder.settings')
django.setup()

from schedules.views import calculate_group_availability
from schedules.models import Group

def fix_all_group_availability():
    """Recalculate availability for all groups"""
    groups = Group.objects.all()
    
    print(f"Found {groups.count()} groups to recalculate...")
    
    for group in groups:
        print(f"Recalculating group: {group.name}")
        try:
            calculate_group_availability(group)
            print(f"✅ Successfully recalculated {group.name}")
        except Exception as e:
            print(f"❌ Error recalculating {group.name}: {e}")
    
    print("✅ Finished recalculating all group availabilities!")

if __name__ == '__main__':
    fix_all_group_availability()
