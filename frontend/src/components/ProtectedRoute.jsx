import React from 'react';
import { Navigate } from 'react-router-dom';

// =============================================================================
// ProtectedRoute — guards a page by checking the JWT token and user role
// =============================================================================
//
// Usage in App.jsx:
//   <Route path="/admin" element={
//     <ProtectedRoute requiredRoles={["admin"]}>
//       <AdminPage />
//     </ProtectedRoute>
//   } />
//
// What it does:
//   1. Reads the "token" and "role" saved in localStorage after Google login
//   2. If no token exists  → redirect to /login (user is not signed in)
//   3. If the role isn't in requiredRoles → redirect to /login (wrong role)
//   4. Otherwise → render the child component normally
//
// =============================================================================

export default function ProtectedRoute({ children, requiredRoles }) {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');

  // No token at all — send to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token exists but role doesn't match what this route requires
  if (requiredRoles && !requiredRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  // All checks passed — render the actual page
  return children;
}
