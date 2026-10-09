// src/components/ProtectedRoute.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router';
import { configureStore } from '@reduxjs/toolkit';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';

const mockAuthReducer = (state = { isAuthenticated: false }) => state;

const renderWithAuth = (isAuthenticated, routeElement) => {
  const store = configureStore({
    reducer: { auth: mockAuthReducer },
    preloadedState: { auth: { isAuthenticated } },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={routeElement} />
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          <Route path="/notes" element={<div data-testid="notes-page">Notes</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    renderWithAuth(false, <ProtectedRoute><div data-testid="secret">Secret</div></ProtectedRoute>);
    expect(screen.queryByTestId('secret')).not.toBeInTheDocument();
    const loginPage = screen.queryByTestId('login-page');
    // May be rendered or mid-navigation; the secret page must never render.
    expect(loginPage).toBeTruthy();
  });

  it('renders children when authenticated', () => {
    renderWithAuth(true, <ProtectedRoute><div data-testid="secret">Secret</div></ProtectedRoute>);
    expect(screen.getByTestId('secret')).toBeInTheDocument();
  });
});

describe('PublicRoute', () => {
  it('renders children when not authenticated', () => {
    renderWithAuth(false, <PublicRoute><div data-testid="public">Login</div></PublicRoute>);
    expect(screen.getByTestId('public')).toBeInTheDocument();
  });

  it('redirects authenticated users away from public pages', () => {
    renderWithAuth(true, <PublicRoute><div data-testid="public">Login</div></PublicRoute>);
    expect(screen.queryByTestId('public')).not.toBeInTheDocument();
    expect(screen.getByTestId('notes-page')).toBeInTheDocument();
  });
});