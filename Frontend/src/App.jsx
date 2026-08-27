import { Routes, Route, Navigate } from "react-router";
import { useSelector } from "react-redux";

import Login from "./auth/login";
import Signup from "./auth/signup";
import ForgotPassword from "./auth/forgotPassword";
import ResetPassword from "./auth/resetPassword";
import NotesPage from "./pages/notes";
import NewNotePage from "./pages/newNote";
import NoteDetails from "./pages/NoteDetails";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";

function App() {
  const { token } = useSelector((state) => state.auth);
  console.log("Token in App.jsx:", token); 
  const isAuthenticated = Boolean(token);

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
      <Route
        path="/notes/new"
        element={
          <ProtectedRoute>
            <NewNotePage />
          </ProtectedRoute>
        }
      />
      <Route path="/notes/:id/edit" element={<ProtectedRoute><NewNotePage /></ProtectedRoute>} />
      <Route path="/notes/:id" element={<ProtectedRoute><NoteDetails /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/notes" : "/login"} replace />} />
    </Routes>
  );
}

export default App;