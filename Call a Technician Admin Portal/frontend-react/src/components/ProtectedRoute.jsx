/*import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export default function ProtectedRoute({ children }){
  const { user, token } = useAuth();
  if(!user || !token) return <Navigate to="/" replace/>;
  return children;
}
*/
// src/components/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export default function ProtectedRoute(){
  const { token } = useAuth();
  const loc = useLocation();
  if(!token) return <Navigate to="/" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}
