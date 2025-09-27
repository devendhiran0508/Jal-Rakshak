import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={`/dashboard/${profile?.role}`} replace />;
  }

  return <>{children}</>;
};