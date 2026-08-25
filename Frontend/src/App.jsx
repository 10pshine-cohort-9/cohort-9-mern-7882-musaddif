import { Routes, Route, Navigate } from "react-router";
import { useSelector } from "react-redux";

import Login from "./auth/login";
import Signup from "./auth/signup";
import ForgotPassword from "./auth/forgotPassword";
import ResetPassword from "./auth/resetPassword";
import NotesPage from "./pages/notes";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";

function App() {
  const { token, user } = useSelector((state) => state.auth || {});
  const isAuthenticated = Boolean(token || user);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? "/notes" : "/login"} replace />} />
      <Route
        path="/login"
        element={<PublicRoute><Login /></PublicRoute>}
      />
      <Route
        path="/signup"
        element={<PublicRoute><Signup /></PublicRoute>}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            <NotesPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/notes" : "/login"} replace />} />
    </Routes>
  );
}

export default App;