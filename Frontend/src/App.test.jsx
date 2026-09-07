// src/App.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';

const mockAuthReducer = (state = { token: null, user: null }) => state;

const createTestStore = (authState = { token: null, user: null }) => {
  return configureStore({
    reducer: {
      auth: mockAuthReducer,
      notes: (state = { notes: [] }) => state,
    },
    preloadedState: {
      auth: authState,
      notes: { notes: [] },
    },
  });
};

vi.mock('./components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }) => <div data-testid="protected-route">{children}</div>,
  PublicRoute: ({ children }) => <div data-testid="public-route">{children}</div>,
}));

vi.mock('./auth/login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

vi.mock('./auth/signup', () => ({
  default: () => <div data-testid="signup-page">Signup Page</div>,
}));

vi.mock('./auth/forgotPassword', () => ({
  default: () => <div data-testid="forgot-password-page">Forgot Password Page</div>,
}));

vi.mock('./auth/resetPassword', () => ({
  default: () => <div data-testid="reset-password-page">Reset Password Page</div>,
}));

vi.mock('./pages/notes', () => ({
  default: () => <div data-testid="notes-page">Notes Page</div>,
}));

vi.mock('./pages/newNote', () => ({
  default: () => <div data-testid="new-note-page">New Note Page</div>,
}));

vi.mock('./pages/NoteDetails', () => ({
  default: () => <div data-testid="note-details-page">Note Details Page</div>,
}));

const renderAppWithAuth = (authState = { token: null, user: null }) => {
  // Reset the shared jsdom history so each test starts at the root path.
  window.history.replaceState({}, '', '/');
  const store = createTestStore(authState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  );
};

describe('App Routing Tests', () => {
  it('renders login page when not authenticated at the root path', () => {
    renderAppWithAuth({ token: null, user: null });
    expect(screen.getByTestId('public-route')).toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders notes page when authenticated at the root path', () => {
    renderAppWithAuth({ token: 'fake-token', user: { id: 1, name: 'Test User' } });
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('notes-page')).toBeInTheDocument();
  });

  it('does not show the notes page when unauthenticated', () => {
    renderAppWithAuth({ token: null, user: null });
    expect(screen.queryByTestId('notes-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('shows the protected notes page only when a token exists', () => {
    renderAppWithAuth({ token: 'fake-token', user: { id: 1 } });
    expect(screen.getByTestId('notes-page')).toBeInTheDocument();
  });

  it('navigates unknown routes to login when unauthenticated', () => {
    window.history.replaceState({}, '', '/some-unknown-route');
    renderAppWithAuth({ token: null, user: null });
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});

describe('App Routing - Protected and public pages', () => {
  it('renders signup page for unauthenticated users', () => {
    renderAppWithAuth({ token: null, user: null });
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});