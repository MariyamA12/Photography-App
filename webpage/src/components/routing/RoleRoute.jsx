// src/components/RoleRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import Spinner from '../ui/Spinner';

export default function RoleRoute({
  requiredRole,
  redirectTo = '/login',
  unauthorizedRedirect = '/unauthorized',
}) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return user.role === requiredRole ? (
    <Outlet />
  ) : (
    <Navigate to={unauthorizedRedirect} replace />
  );
}
