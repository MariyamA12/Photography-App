// Parent Dashboard
// src/pages/Parent/ParentDashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../../features/auth/useAuth';
import { useToast } from '../../features/toast/useToast';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../constants/routes';
import Button from '../../components/ui/Button';

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast('Logged out successfully', 'success');
      navigate(routes.LOGIN, { replace: true });
    } catch (err) {
      toast('Logout failed', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Parent Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-lg">Hello, {user.name}</span>
          <Button
            variant="primary"
            onClick={handleLogout}
            isLoading={isLoggingOut}
          >
            Logout
          </Button>
        </div>
      </header>
      {/* Add parent-specific content here */}
    </div>
  );
}
