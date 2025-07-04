#!/usr/bin/env python
"""
Script to clean duplicate availability records.
"""

import os
import sys
import django

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freetimefinder.settings')
django.setup()

from schedules.models import Availability
from django.db.models import Count

def clean_duplicate_availability():
    """Remove duplicate availability records"""
    print("Finding duplicate availability records...")
    
    # Find duplicates
    duplicates = (
        Availability.objects
        .values('user', 'day_of_week', 'start_time', 'end_time')
        .annotate(count=Count('id'))
        .filter(count__gt=1)
    )
    
    total_removed = 0
    
    for duplicate in duplicates:
        # Get all records for this combination
        records = Availability.objects.filter(
            user=duplicate['user'],
            day_of_week=duplicate['day_of_week'],
            start_time=duplicate['start_time'],
            end_time=duplicate['end_time']
        ).order_by('id')
        
        # Keep the first one, delete the rest
        records_to_delete = records[1:]
        count = len(records_to_delete)
        
        if count > 0:
            print(f"Removing {count} duplicate records for user {duplicate['user']}, day {duplicate['day_of_week']}, {duplicate['start_time']}-{duplicate['end_time']}")
            for record in records_to_delete:
                record.delete()
            total_removed += count
    
    print(f"✅ Removed {total_removed} duplicate availability records!")
    
    # Show final count
    total_remaining = Availability.objects.count()
    print(f"Total availability records remaining: {total_remaining}")

if __name__ == '__main__':
    clean_duplicate_availability()
