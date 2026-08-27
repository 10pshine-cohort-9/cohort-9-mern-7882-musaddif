import { Navigate, useLocation } from "react-router";
import { useSelector } from "react-redux";

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { token } = useSelector((state) => state.auth || {});
  const isAuthenticated = Boolean(token);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const location = useLocation();
  const { token } = useSelector((state) => state.auth || {});
  const isAuthenticated = Boolean(token);

  if (isAuthenticated) {
    const redirectPath = location.state?.from?.pathname || "/notes";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
