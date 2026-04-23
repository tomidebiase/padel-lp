import { Navigate } from 'react-router-dom';

function ProtectedAdminRoute({ children }) {
  const isAuthenticated = localStorage.getItem('adminAuth') === 'true';
  const adminUser = localStorage.getItem('adminUser');

  if (!isAuthenticated || !adminUser) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

export default ProtectedAdminRoute;