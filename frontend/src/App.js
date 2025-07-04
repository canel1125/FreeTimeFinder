import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BusyTimes from './pages/BusyTimes';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/busy-times" element={
                <PrivateRoute>
                  <BusyTimes />
                </PrivateRoute>
              } />
              <Route path="/groups" element={
                <PrivateRoute>
                  <Groups />
                </PrivateRoute>
              } />
              <Route path="/groups/:id" element={
                <PrivateRoute>
                  <GroupDetail />
                </PrivateRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
