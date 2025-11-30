// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({ redirectTo = '/login' }) {
  const { user, loading } = useAuth();

  // Show spinner while auth state is being initialized/refreshed
  if (loading) return <Spinner />;

  return user ? <Outlet /> : <Navigate to={redirectTo} replace />;
}
