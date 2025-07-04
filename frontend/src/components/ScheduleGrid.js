import React, { useState, useEffect, useCallback } from 'react';

const DAYS = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

const HOURS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

const ScheduleGrid = ({ availability = [], onToggle, readonly = false, busyMode = false }) => {
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState('');


  useEffect(() => {
    if (selectedCells.size > 0) {
      const duration = selectedCells.size * 30;
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      let timeText = '';
      if (hours > 0) timeText += `${hours}h `;
      if (minutes > 0) timeText += `${minutes}m`;
      

      setSelectionInfo(`${selectedCells.size} slot${selectedCells.size !== 1 ? 's' : ''} selected (${timeText.trim()})`);
    } else {
      setSelectionInfo('');
    }
  }, [selectedCells]);

  const handleMouseUp = useCallback((e) => {
    if (readonly || !isSelecting) return;
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsSelecting(false);
    
    if (selectedCells.size > 0 && onToggle) {

      const timeSlots = Array.from(selectedCells).map(cellKey => {
        const [day, time] = cellKey.split('-');
        return { day: parseInt(day), time };
      });
      
      onToggle(timeSlots);
    }
    
    setSelectedCells(new Set());
  }, [readonly, isSelecting, selectedCells, onToggle]);


  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      if (isSelecting) {
        handleMouseUp(e);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isSelecting, handleMouseUp]);

  const isAvailable = useCallback((day, time) => {
    return availability.some(slot => {
      const slotStart = slot.start_time.slice(0, 5);
      const slotEnd = slot.end_time.slice(0, 5);
      return slot.day_of_week === day && 
             slotStart <= time && 
             slotEnd > time;
    });
  }, [availability]);

  const handleMouseDown = (e, day, time) => {
    if (readonly) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsSelecting(true);
    const cellKey = `${day}-${time}`;
    
    if (selectedCells.has(cellKey)) {
      setSelectedCells(new Set());
    } else {
      setSelectedCells(new Set([cellKey]));
    }
  };

  const handleMouseEnter = (e, day, time) => {
    if (readonly || !isSelecting) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const cellKey = `${day}-${time}`;
    setSelectedCells(prev => new Set([...prev, cellKey]));
  };

  const handleKeyDown = useCallback((e, day, time) => {
    if (readonly) return;
    

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const timeSlots = [{ day, time }];
      if (onToggle) {
        onToggle(timeSlots);
      }
    }
  }, [readonly, onToggle]);

  const isSelected = useCallback((day, time) => {
    return selectedCells.has(`${day}-${time}`);
  }, [selectedCells]);

  return (
    <div>

      {!readonly && (
        <div
          className={`selection-info-container`}
          style={{ minHeight: 32, marginBottom: selectionInfo ? 10 : 0 }}
        >
          {selectionInfo && (
            <div className={`selection-info ${
              selectedCells.size > 100 ? 'error' : 
              selectedCells.size > 50 ? 'warning' : ''
            }`}>
              {selectionInfo}
            </div>
          )}
        </div>
      )}
      <div className="schedule-grid" onMouseUp={handleMouseUp}>
        <div className="schedule-header"></div>
        {DAYS.map(day => (
          <div key={day.value} className="schedule-header">
            {day.label}
          </div>
        ))}
        {HOURS.map(time => (
          <React.Fragment key={time}>
            <div className="schedule-time">{time}</div>
            {DAYS.map(day => (
              <div
                key={`${day.value}-${time}`}
                className={`schedule-cell ${
                  isAvailable(day.value, time) ? (busyMode ? 'busy' : 'available') : ''
                } ${
                  isSelected(day.value, time) ? 'selected' : ''
                } ${
                  readonly ? 'readonly' : ''
                }`}
                onMouseDown={(e) => handleMouseDown(e, day.value, time)}
                onMouseEnter={(e) => handleMouseEnter(e, day.value, time)}
                onKeyDown={(e) => handleKeyDown(e, day.value, time)}
                tabIndex={readonly ? -1 : 0}
                role="button"
                aria-label={`${isAvailable(day.value, time) ? (busyMode ? 'Busy' : 'Available') : (busyMode ? 'Free' : 'Not available')} time slot: ${day.label} at ${time}`}
                style={{ userSelect: 'none' }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ScheduleGrid;
