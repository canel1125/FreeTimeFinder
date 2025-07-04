import React, { useState, useEffect } from 'react';
import ScheduleGrid from '../components/ScheduleGrid';
import api from '../services/api';

const Availability = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await api.get('/availabilities/');
      setAvailability(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setMessage('Error loading availability');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (timeSlots) => {
    setSaving(true);
    setMessage('');

    try {

      const dayGroups = {};
      timeSlots.forEach(slot => {
        if (!dayGroups[slot.day]) {
          dayGroups[slot.day] = [];
        }
        dayGroups[slot.day].push(slot.time);
      });


      for (const [day, times] of Object.entries(dayGroups)) {
        times.sort();
        const startTime = times[0];
        const endTimeIndex = times.length - 1;
        const endTime = times[endTimeIndex];
        

        const [hours, minutes] = endTime.split(':').map(Number);
        const endTimeObj = new Date();
        endTimeObj.setHours(hours, minutes + 30, 0, 0);
        const finalEndTime = endTimeObj.toTimeString().slice(0, 5);

        await api.post('/availabilities/', {
          day_of_week: parseInt(day),
          start_time: startTime,
          end_time: finalEndTime
        });
      }

      await fetchAvailability();
      setMessage('Availability updated successfully!');
    } catch (error) {
      console.error('Error updating availability:', error);
      setMessage('Error updating availability');
    } finally {
      setSaving(false);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all availability?')) {
      return;
    }

    setSaving(true);
    try {
      await api.delete('/availabilities/clear_all/');
      await fetchAvailability();
      setMessage('All availability cleared!');
    } catch (error) {
      console.error('Error clearing availability:', error);
      setMessage('Error clearing availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading availability...</div>;
  }

  return (
    <div>
      <div className="group-header">
        <h1>My Availability</h1>
        <div className="group-actions">
          <button 
            onClick={clearAll} 
            className="btn btn-danger"
            disabled={saving}
          >
            Clear All
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {message}
        </div>
      )}        <div className="card">
          <h3>Set Your Weekly Availability</h3>
          <p>
            <strong>How to use:</strong> Click and drag to select time slots when you're available. 
            You can also click individual cells or use keyboard navigation (Tab + Space/Enter).
            Green cells show your current availability.
          </p>

        <div className="availability-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#d4edda' }}></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#007bff' }}></div>
            <span>Selecting</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'white', border: '1px solid #ccc' }}></div>
            <span>Not Available</span>
          </div>
        </div>

        {saving && (
          <div className="alert alert-info">
            Updating availability...
          </div>
        )}

        <ScheduleGrid 
          availability={availability}
          onToggle={handleToggle}
        />

        <div style={{ marginTop: '20px' }}>
          <h4>Current Availability Summary</h4>
          {availability.length > 0 ? (
            <div>
              <div className="availability-stats">
                <div className="stat-item">
                  <span className="stat-number">{availability.length}</span>
                  <span className="stat-label">Time Blocks</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {Math.round(availability.reduce((total, slot) => {
                      const start = new Date(`1970-01-01T${slot.start_time}`);
                      const end = new Date(`1970-01-01T${slot.end_time}`);
                      return total + (end - start) / (1000 * 60 * 60);
                    }, 0) * 10) / 10}h
                  </span>
                  <span className="stat-label">Total Hours</span>
                </div>
              </div>
              
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                const daySlots = availability.filter(slot => slot.day_of_week === index);
                return daySlots.length > 0 ? (
                  <div key={day} className="time-slot">
                    <div className="time-slot-day">{day}</div>
                    {daySlots.map((slot, i) => (
                      <div key={i} className="time-slot-time">
                        {slot.start_time} - {slot.end_time}
                      </div>
                    ))}
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <p>No availability set. Click and drag on the schedule above to set your availability.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Availability;
