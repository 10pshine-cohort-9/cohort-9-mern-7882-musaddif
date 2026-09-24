import { Navigate, useLocation } from "react-router";
import { useSelector } from "react-redux";

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth || {});
  const authenticated = Boolean(isAuthenticated);

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth || {});
  const authenticated = Boolean(isAuthenticated);

  if (authenticated) {
    const redirectPath = location.state?.from?.pathname || "/notes";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
