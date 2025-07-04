import React, { useState, useEffect } from 'react';
import ScheduleGrid from '../components/ScheduleGrid';
import api from '../services/api';

const BusyTimes = () => {
  const [busyTimes, setBusyTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBusyTimes();
  }, []);

  const fetchBusyTimes = async () => {
    try {
      const response = await api.get('/busy-times/');
      setBusyTimes(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching busy times:', error);
      setMessage('Error loading busy times');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (timeSlots) => {

    if (timeSlots.length > 150) {
      setMessage('❌ Selection too large! Please select fewer than 150 time slots to ensure good performance. Consider breaking your busy times into smaller chunks.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {

      const dayGroups = {};
      

      const sortedTimeSlots = timeSlots.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        const [aHour, aMin] = a.time.split(':').map(Number);
        const [bHour, bMin] = b.time.split(':').map(Number);
        return (aHour * 60 + aMin) - (bHour * 60 + bMin);
      });
      
      sortedTimeSlots.forEach(slot => {
        if (!dayGroups[slot.day]) {
          dayGroups[slot.day] = [];
        }
        dayGroups[slot.day].push(slot.time);
      });


      const busyTimeEntries = [];
      
      for (const [day, times] of Object.entries(dayGroups)) {

        

        const blocks = [];
        let currentBlock = [times[0]];
        
        for (let i = 1; i < times.length; i++) {
          const currentTime = times[i];
          const previousTime = times[i - 1];
          

          const [prevHour, prevMin] = previousTime.split(':').map(Number);
          const [currHour, currMin] = currentTime.split(':').map(Number);
          
          const prevMinutes = prevHour * 60 + prevMin;
          const currMinutes = currHour * 60 + currMin;
          
          if (currMinutes - prevMinutes === 30) {

            currentBlock.push(currentTime);
          } else {

            blocks.push(currentBlock);
            currentBlock = [currentTime];
          }
        }
        

        if (currentBlock.length > 0) {
          blocks.push(currentBlock);
        }
        

        blocks.forEach(block => {
          const startTime = block[0];
          const endTime = block[block.length - 1];
          

          const [hours, minutes] = endTime.split(':').map(Number);
          

          let finalEndTime;
          if (hours === 23 && minutes === 30) {

            finalEndTime = "23:59";
          } else {

            const totalMinutes = hours * 60 + minutes + 30;
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            

            if (newHours >= 24) {
              finalEndTime = "23:59";
            } else {
              finalEndTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
            }
          }

          busyTimeEntries.push({
            day_of_week: parseInt(day),
            start_time: startTime,
            end_time: finalEndTime
          });
        });
      }


      const response = await api.post('/busy-times/batch_create/', {
        busy_times: busyTimeEntries
      });


      await fetchBusyTimes();
      
      let message = `✅ Busy times updated! Created ${response.data.created_count}`;
      if (response.data.total_requested) {
        message += ` of ${response.data.total_requested} requested`;
      }
      message += ' time blocks.';
      
      if (response.data.errors && response.data.errors.length > 0) {
        message += ` (${response.data.errors.length} errors occurred)`;
        console.warn('Errors during creation:', response.data.errors);
      }
      
      setMessage(message);
      

      console.log('Batch creation result:', {
        requested: busyTimeEntries.length,
        created: response.data.created_count,
        errors: response.data.errors
      });
    } catch (error) {
      console.error('Error updating busy times:', error);
      
      let errorMessage = '❌ Error updating busy times.';
      if (error.response?.data?.error) {
        errorMessage += ` ${error.response.data.error}`;
      }
      if (error.response?.data?.errors) {
        console.error('Detailed errors:', error.response.data.errors);
        errorMessage += ` Check console for details.`;
      }
      
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all busy times?')) {
      return;
    }

    setSaving(true);
    try {
      await api.delete('/busy-times/clear_all/');
      await fetchBusyTimes();
      setMessage('All busy times cleared!');
    } catch (error) {
      console.error('Error clearing busy times:', error);
      setMessage('Error clearing busy times');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading busy times...</div>;
  }

  return (
    <div>
      <div className="group-header">
        <h1>My Busy Times</h1>
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
      )}

      <div className="card">
        <h3>Mark Your Busy Times</h3>
        <p>
          <strong>How to use:</strong> Click and drag to select time slots when you are <strong>BUSY</strong> or unavailable. 
          The system will calculate free time slots when coordinating with groups by finding times when <strong>no one</strong> is busy.
          Red cells show your current busy times.
        </p>
        
        <div style={{ background: '#e7f3ff', padding: '10px', marginBottom: '15px', borderRadius: '5px', fontSize: '14px' }}>
          <strong>💡 Tips:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>You can select up to 150 time slots at once for good performance</li>
            <li>Large selections will be automatically split into optimal blocks</li>
            <li>The last time slot (23:30) automatically extends to end of day (23:59)</li>
            <li>Overlapping times will be merged automatically</li>
          </ul>
        </div>

        <div className="availability-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f8d7da' }}></div>
            <span>Busy Time</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#007bff' }}></div>
            <span>Selecting</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'white', border: '1px solid #ccc' }}></div>
            <span>Free Time</span>
          </div>
        </div>

        {saving && (
          <div className="alert alert-info">
            Updating busy times...
          </div>
        )}

        <ScheduleGrid 
          availability={busyTimes}
          onToggle={handleToggle}
          busyMode={true}
        />

        <div style={{ marginTop: '20px' }}>
          <h4>Current Busy Times Summary</h4>
          {busyTimes.length > 0 ? (
            <div>
              <div className="availability-stats">
                <div className="stat-item">
                  <span className="stat-number">{busyTimes.length}</span>
                  <span className="stat-label">Busy Blocks</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {Math.round(busyTimes.reduce((total, slot) => {
                      const start = new Date(`1970-01-01T${slot.start_time}`);
                      const end = new Date(`1970-01-01T${slot.end_time}`);
                      return total + (end - start) / (1000 * 60 * 60);
                    }, 0) * 10) / 10}h
                  </span>
                  <span className="stat-label">Total Busy Hours</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {Math.round((168 - busyTimes.reduce((total, slot) => {
                      const start = new Date(`1970-01-01T${slot.start_time}`);
                      const end = new Date(`1970-01-01T${slot.end_time}`);
                      return total + (end - start) / (1000 * 60 * 60);
                    }, 0)) * 10) / 10}h
                  </span>
                  <span className="stat-label">Free Hours per Week</span>
                </div>
              </div>
              
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                const daySlots = busyTimes.filter(slot => slot.day_of_week === index);
                return daySlots.length > 0 ? (
                  <div key={day} className="time-slot busy-time-slot">
                    <div className="time-slot-day">{day}</div>
                    {daySlots.map((slot, i) => (
                      <div key={i} className="time-slot-time">
                        {slot.start_time} - {slot.end_time} (Busy)
                      </div>
                    ))}
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <p>No busy times set. You appear to be free all week! Click and drag on the schedule above to mark when you are busy.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusyTimes;
