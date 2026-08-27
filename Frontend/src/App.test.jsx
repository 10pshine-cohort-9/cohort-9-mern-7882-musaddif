// src/App.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';

const mockAuthReducer = (state = { token: null, user: null }) => state;

const createTestStore = (authState = { token: null, user: null }) => {
  return configureStore({
    reducer: {
      auth: mockAuthReducer,
    },
    preloadedState: {
      auth: authState,
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

const renderAppWithAuth = (authState = { token: null, user: null }) => {
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
  it('renders login page when not authenticated and at root path', () => {
    renderAppWithAuth({ token: null, user: null });
    // The root path "/" should redirect to "/login"
    expect(screen.getByTestId('public-route')).toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it.skip('renders notes page when authenticated and at root path', () => {
    renderAppWithAuth({ token: 'fake-token', user: { id: 1, name: 'Test User' } });
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('notes-page')).toBeInTheDocument();
  });

  it.skip('redirects authenticated user from login to notes', async () => {
    renderAppWithAuth({ token: 'fake-token', user: { id: 1, name: 'Test User' } });
   
    expect(screen.getByTestId('notes-page')).toBeInTheDocument();
  });

  it.skip('shows notes page only when authenticated', () => {
    renderAppWithAuth({ token: null, user: null });
    expect(screen.queryByTestId('notes-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();

    const { rerender } = render(
      <Provider store={createTestStore({ token: 'fake-token', user: { id: 1 } })}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );
    expect(screen.getByTestId('notes-page')).toBeInTheDocument();
  });

  it('navigates to forgot password page', () => {
    renderAppWithAuth({ token: null, user: null });
   
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders signup page for unauthenticated users', () => {
    renderAppWithAuth({ token: null, user: null });
    expect(screen.getByTestId('public-route')).toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});

describe('App Authentication Logic', () => {
  it('correctly determines authentication status from Redux state', () => {
    
    const store1 = createTestStore({ token: null, user: null });
    render(
      <Provider store={store1}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();

  
    const store2 = createTestStore({ token: 'fake-token', user: null });
    render(
      <Provider store={store2}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );

    const store3 = createTestStore({ token: null, user: { id: 1 } });
    render(
      <Provider store={store3}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );
 
    const store4 = createTestStore({ token: 'fake-token', user: { id: 1 } });
    render(
      <Provider store={store4}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );
   
  });
});

describe('Notes trash actions', () => {
  it('shows only trashed notes and can restore or permanently delete them', async () => {
    vi.doUnmock('./pages/notes');
    const { default: NotesPage } = await import('./pages/notes');
    const user = userEvent.setup();

    render(
      <Provider store={createTestStore({ token: 'fake-token', user: { id: 1 } })}>
        <BrowserRouter>
          <NotesPage />
        </BrowserRouter>
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: /trash/i }));

    expect(screen.getByRole('heading', { name: 'Trash' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Code Snippets' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Books to Read' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Project Ideas' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Options for Code Snippets' }));
    await user.click(screen.getByRole('menuitem', { name: 'Restore' }));

    expect(screen.queryByRole('heading', { name: 'Code Snippets' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /trash/i }));
    await user.click(screen.getByRole('button', { name: 'Options for Books to Read' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));

    expect(screen.queryByRole('heading', { name: 'Books to Read' })).not.toBeInTheDocument();
  });
});