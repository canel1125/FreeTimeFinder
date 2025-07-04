import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="card">
        <h1>Welcome to FreeTimeFinder</h1>
        <p>
          The easiest way to coordinate schedules and find common free time with your team, 
          friends, or family.
        </p>
        
        {user ? (
          <div>
            <p>Welcome back, {user.username}!</p>
            <Link to="/dashboard" className="btn">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div>
            <h2>Features</h2>
            <ul>
              <li>Set your weekly availability</li>
              <li>Create groups and invite members</li>
              <li>Automatically find common free time slots</li>
              <li>Schedule events when everyone is available</li>
              <li>Responsive design works on all devices</li>
            </ul>
            
            <div style={{ marginTop: '30px' }}>
              <Link to="/register" className="btn" style={{ marginRight: '10px' }}>
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
