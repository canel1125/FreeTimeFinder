import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    groups: 0,
    availabilitySlots: 0,
    upcomingEvents: 0
  });
  const [recentGroups, setRecentGroups] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [groupsRes, availabilityRes, eventsRes] = await Promise.all([
        api.get('/groups/'),
        api.get('/availabilities/'),
        api.get('/events/')
      ]);

      setStats({
        groups: groupsRes.data.results?.length || groupsRes.data.length || 0,
        availabilitySlots: availabilityRes.data.results?.length || availabilityRes.data.length || 0,
        upcomingEvents: eventsRes.data.results?.length || eventsRes.data.length || 0
      });

      setRecentGroups((groupsRes.data.results || groupsRes.data).slice(0, 3));
      setUpcomingEvents((eventsRes.data.results || eventsRes.data).slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome back, {user?.username || user?.full_name}!</p>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-number">{stats.groups}</div>
          <div className="stat-label">Groups</div>
        </div>
        <div className="card stat-card">
          <div className="stat-number">{stats.availabilitySlots}</div>
          <div className="stat-label">Availability Slots</div>
        </div>
        <div className="card stat-card">
          <div className="stat-number">{stats.upcomingEvents}</div>
          <div className="stat-label">Upcoming Events</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="group-header">
            <h3>Recent Groups</h3>
            <Link to="/groups" className="btn btn-secondary">
              View All
            </Link>
          </div>
          
          {recentGroups.length > 0 ? (
            <ul className="member-list">
              {recentGroups.map(group => (
                <li key={group.id} className="member-item">
                  <div className="member-info">
                    <div className="member-name">{group.name}</div>
                    <div className="member-email">
                      {group.member_count} member(s)
                    </div>
                  </div>
                  <Link to={`/groups/${group.id}`} className="btn btn-secondary">
                    View
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <p>No groups yet.</p>
              <Link to="/groups" className="btn">
                Create Your First Group
              </Link>
            </div>
          )}
        </div>

        <div className="card">
          <div className="group-header">
            <h3>Quick Actions</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/busy-times" className="btn">
              Set My Busy Times
            </Link>
            <Link to="/groups" className="btn btn-secondary">
              Manage Groups
            </Link>
            {stats.availabilitySlots === 0 && (
              <div className="alert alert-info">
                <strong>Get started:</strong> Set your busy times to let others know when you're free!
              </div>
            )}
          </div>
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <div className="card">
          <h3>Upcoming Events</h3>
          <ul className="member-list">
            {upcomingEvents.map(event => (
              <li key={event.id} className="member-item">
                <div className="member-info">
                  <div className="member-name">{event.name}</div>
                  <div className="member-email">
                    {event.date} at {event.start_time} - {event.group_name}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
