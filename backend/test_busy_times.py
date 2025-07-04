#!/usr/bin/env python3
"""
Test script to verify busy times functionality, especially:
1. Handling of 23:30 time slot
2. Creation of multiple busy time blocks
3. Batch creation performance

Run this script from the backend directory after setting up the Django environment.
"""

import os
import sys
import django
from datetime import time

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from schedules.models import BusyTime

def test_busy_times():
    """Test busy times functionality"""
    
    print("=== TESTING BUSY TIMES FUNCTIONALITY ===\n")
    
    # Create or get test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com', 'first_name': 'Test', 'last_name': 'User'}
    )
    print(f"Using test user: {user.username} (created: {created})")
    
    # Clear existing busy times for clean test
    BusyTime.objects.filter(user=user).delete()
    print("Cleared existing busy times")
    
    # Test 1: Create busy time ending at 23:30 -> 23:59
    print("\n--- Test 1: 23:30 time slot ---")
    busy_23_30 = BusyTime.objects.create(
        user=user,
        day_of_week=0,  # Monday
        start_time=time(23, 30),
        end_time=time(23, 59)
    )
    print(f"Created: {busy_23_30}")
    
    # Test 2: Create multiple busy times (batch simulation)
    print("\n--- Test 2: Multiple busy times ---")
    busy_times_data = [
        (0, time(9, 0), time(10, 30)),   # Monday 9:00-10:30
        (0, time(14, 0), time(15, 0)),   # Monday 14:00-15:00
        (1, time(10, 0), time(12, 0)),   # Tuesday 10:00-12:00
        (2, time(16, 30), time(18, 0)),  # Wednesday 16:30-18:00
        (5, time(8, 0), time(9, 30)),    # Saturday 8:00-9:30
        (6, time(23, 0), time(23, 59)),  # Sunday 23:00-23:59 (edge case)
    ]
    
    created_count = 0
    for day, start, end in busy_times_data:
        busy_time = BusyTime.objects.create(
            user=user,
            day_of_week=day,
            start_time=start,
            end_time=end
        )
        created_count += 1
        print(f"Created: {busy_time}")
    
    print(f"\nCreated {created_count} busy time blocks")
    
    # Test 3: Verify all busy times
    print("\n--- Test 3: Verification ---")
    all_busy_times = BusyTime.objects.filter(user=user).order_by('day_of_week', 'start_time')
    print(f"Total busy times in database: {all_busy_times.count()}")
    
    for bt in all_busy_times:
        print(f"  {bt}")
    
    # Test 4: Edge cases
    print("\n--- Test 4: Edge cases ---")
    
    # Try to create overlapping busy times
    try:
        overlapping = BusyTime.objects.create(
            user=user,
            day_of_week=0,
            start_time=time(9, 30),
            end_time=time(10, 0)
        )
        print(f"Overlapping time created: {overlapping}")
    except Exception as e:
        print(f"Overlapping time rejected (expected): {e}")
    
    # Test time validation
    try:
        invalid_time = BusyTime.objects.create(
            user=user,
            day_of_week=3,
            start_time=time(15, 0),
            end_time=time(14, 0)  # End before start
        )
        print(f"Invalid time created (unexpected): {invalid_time}")
    except Exception as e:
        print(f"Invalid time rejected (expected): {e}")
    
    print("\n=== TEST COMPLETED ===")

if __name__ == "__main__":
    test_busy_times()
