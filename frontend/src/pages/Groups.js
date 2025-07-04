import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups/');
      setGroups(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setMessage('Error loading groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');

    try {
      await api.post('/groups/', newGroup);
      await fetchGroups();
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '' });
      setMessage('Group created successfully!');
    } catch (error) {
      console.error('Error creating group:', error);
      setMessage('Error creating group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setJoining(true);
    setMessage('');

    try {
      await api.post('/groups/join/', {
        invite_code: joinCode.toUpperCase()
      });
      await fetchGroups();
      setShowJoinModal(false);
      setJoinCode('');
      setMessage('Successfully joined group!');
    } catch (error) {
      console.error('Error joining group:', error);
      const errorMsg = error.response?.data?.error || 'Error joining group';
      setMessage(errorMsg);
    } finally {
      setJoining(false);
    }
  };

  const handleInputChange = (e) => {
    setNewGroup({
      ...newGroup,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return <div className="loading">Loading groups...</div>;
  }

  return (
    <div>
      <div className="group-header">
        <h1>My Groups</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowJoinModal(true)}
            className="btn btn-secondary"
          >
            Join Group
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn"
          >
            Create New Group
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {groups.length > 0 ? (
        <div className="grid grid-2">
          {groups.map(group => (
            <div key={group.id} className="card">
              <h3>{group.name}</h3>
              {group.description && (
                <p>{group.description}</p>
              )}
              
              <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                <small>
                  <strong>Creator:</strong> {group.creator.username} <br />
                  <strong>Members:</strong> {group.member_count} <br />
                  <strong>Invite Code:</strong> <code style={{backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '3px'}}>{group.invite_code}</code> <br />
                  <strong>Created:</strong> {new Date(group.created_at).toLocaleDateString()}
                </small>
              </div>

              <div className="group-actions">
                <Link to={`/groups/${group.id}`} className="btn">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <h3>No Groups Yet</h3>
          <p>
            Create your first group to start coordinating schedules with others.
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn"
          >
            Create Your First Group
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Group</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label htmlFor="name">Group Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={newGroup.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-control"
                  rows="3"
                  value={newGroup.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Join Group by Invite Code</h2>
              <button 
                className="modal-close"
                onClick={() => setShowJoinModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleJoinGroup}>
              <div className="form-group">
                <label htmlFor="joinCode">Invite Code</label>
                <input
                  type="text"
                  id="joinCode"
                  name="joinCode"
                  className="form-control"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn"
                  disabled={joining}
                >
                  {joining ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
