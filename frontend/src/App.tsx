import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Reports from './pages/Reports';
import SubscriptionsPage from './pages/SubscriptionsPage';
import JunkFeesPage from './pages/JunkFeesPage';
import WrappedPage from './pages/WrappedPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard onLogout={() => {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }} />} />
        <Route path="/reports" element={<Reports onLogout={() => {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }} />} />
        <Route path="/subscriptions" element={<SubscriptionsPage onLogout={() => {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }} />} />
        <Route path="/junk-fees" element={<JunkFeesPage onLogout={() => {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }} />} />
        <Route path="/wrapped" element={<WrappedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
