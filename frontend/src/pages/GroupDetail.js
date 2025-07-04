import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ScheduleGrid from '../components/ScheduleGrid';
import api from '../services/api';

const GroupDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchGroupDetails = useCallback(async () => {
    try {
      const response = await api.get(`/groups/${id}/`);
      setGroup(response.data);
    } catch (error) {
      console.error('Error fetching group details:', error);
      setMessage('Error loading group details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchGroupAvailability = useCallback(async () => {
    try {
      const response = await api.get(`/groups/${id}/availability/`);
      setAvailability(response.data);
    } catch (error) {
      console.error('Error fetching group availability:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchGroupDetails();
      fetchGroupAvailability();
    }
  }, [id, fetchGroupDetails, fetchGroupAvailability]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAdding(true);
    setMessage('');

    try {

      const selectedUser = searchResults.find(u => u.username === newMemberUsername);
      
      if (!selectedUser) {
        setMessage('Please select a user from the search results');
        setAdding(false);
        return;
      }

      await api.post(`/groups/${id}/add_member/`, {
        user_id: selectedUser.id
      });

      await fetchGroupDetails();
      await fetchGroupAvailability();
      setShowAddMember(false);
      setNewMemberUsername('');
      setSearchResults([]);
      setMessage('Member added successfully!');
    } catch (error) {
      console.error('Error adding member:', error);
      const errorMsg = error.response?.data?.error || 'Error adding member';
      setMessage(errorMsg);
    } finally {
      setAdding(false);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get(`/auth/users/search/?search=${query}`);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setNewMemberUsername(value);
    searchUsers(value);
  };

  const selectUser = (user) => {
    setNewMemberUsername(user.username);
    setSearchResults([]);
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await api.post(`/groups/${id}/remove_member/`, {
        user_id: memberId
      });

      await fetchGroupDetails();
      await fetchGroupAvailability();
      setMessage('Member removed successfully!');
    } catch (error) {
      console.error('Error removing member:', error);
      const errorMsg = error.response?.data?.error || 'Error removing member';
      setMessage(errorMsg);
    }
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm('Are you sure you want to regenerate the invite code? The old code will no longer work.')) {
      return;
    }

    try {
      const response = await api.post(`/groups/${id}/regenerate_code/`);
      setGroup(prev => ({
        ...prev,
        invite_code: response.data.invite_code
      }));
      setMessage('Invite code regenerated successfully!');
    } catch (error) {
      console.error('Error regenerating code:', error);
      const errorMsg = error.response?.data?.error || 'Error regenerating code';
      setMessage(errorMsg);
    }
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setMessage('Invite code copied to clipboard!');
    } catch (error) {

      const textArea = document.createElement('textarea');
      textArea.value = group.invite_code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setMessage('Invite code copied to clipboard!');
    }
  };

  const isCreator = group && user && group.creator.id === user.user_id;

  if (loading) {
    return <div className="loading">Loading group details...</div>;
  }

  if (!group) {
    return (
      <div className="card">
        <h2>Group not found</h2>
        <Link to="/groups" className="btn">
          Back to Groups
        </Link>
    </div>
  );
}

  return (
    <div>
      <div className="group-header">
        <div>
          <h1>{group.name}</h1>
          <Link to="/groups" className="btn btn-secondary">
            ← Back to Groups
          </Link>
        </div>
        {isCreator && (
          <div className="group-actions">
            <button 
              onClick={handleRegenerateCode}
              className="btn btn-secondary"
            >
              Regenerate Code
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h3>Group Information</h3>
          <p><strong>Description:</strong> {group.description || 'No description'}</p>
          <p><strong>Creator:</strong> {group.creator.username}</p>
          <p><strong>Created:</strong> {new Date(group.created_at).toLocaleDateString()}</p>
          <p><strong>Total Members:</strong> {group.member_count}</p>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h4 style={{ marginBottom: '10px' }}>Invite Code</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <code style={{ 
                backgroundColor: 'white', 
                padding: '8px 12px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                fontSize: '16px',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}>
                {group.invite_code}
              </code>
              <button 
                onClick={copyInviteCode}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Copy
              </button>
            </div>
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              Share this code with people you want to invite to the group.
            </p>
          </div>
        </div>

        <div className="card">
          <h3>Members</h3>
          <ul className="member-list">
            <li className="member-item">
              <div className="member-info">
                <div className="member-name">{group.creator.username} (Creator)</div>
                <div className="member-email">{group.creator.email}</div>
              </div>
            </li>
            {group.members.map(member => (
              <li key={member.id} className="member-item">
                <div className="member-info">
                  <div className="member-name">{member.username}</div>
                  <div className="member-email">{member.email}</div>
                </div>
                {isCreator && (
                  <button 
                    onClick={() => handleRemoveMember(member.id)}
                    className="btn btn-danger"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3>Common Free Time Slots</h3>
        {availability.length > 0 ? (
          <div>
            <p>Here are the time slots when <strong>everyone is free</strong> (no one is busy):</p>
            

            <div style={{ marginBottom: '20px' }}>
              <h4>Visual Schedule</h4>
              <div className="availability-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#d4edda' }}></div>
                  <span>Common Free Time (No One is Busy)</span>
                </div>
              </div>
              <ScheduleGrid 
                availability={availability}
                readonly={true}
              />
            </div>
            

            <h4>Detailed Schedule</h4>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
              const daySlots = availability.filter(slot => slot.day_of_week === index);
              return daySlots.length > 0 ? (
                <div key={day} className="time-slot">
                  <div className="time-slot-day">{day}</div>
                  {daySlots.map((slot, i) => (
                    <div key={i}>
                      <div className="time-slot-time">
                        {slot.start_time} - {slot.end_time}
                      </div>
                      <div className="time-slot-members">
                        All {slot.member_count} members are free
                      </div>
                    </div>
                  ))}
                </div>
              ) : null;
            })}
          </div>
        ) : (
          <div>
            <p>No common free time found yet.</p>
            <p>Members need to set their busy times first so the system can calculate when everyone is free.</p>
            <Link to="/busy-times" className="btn btn-primary">
              Set Your Busy Times
            </Link>
          </div>
        )}
          </div>
        </div>
      )}


export default GroupDetail;
