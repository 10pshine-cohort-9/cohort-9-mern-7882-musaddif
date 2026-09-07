// src/auth/login.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import Login from './login';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  loginUser: vi.fn(),
  clearError: vi.fn(),
}));

const authState = { loading: false, error: null };

vi.mock('react-redux', () => ({
  useDispatch: () => mocks.dispatch,
  useSelector: (selector) => selector({ auth: authState }),
}));

vi.mock('../store/thunk/authThunk', () => ({
  loginUser: mocks.loginUser,
}));

vi.mock('../store/slice/authSlice', () => ({
  clearError: mocks.clearError,
}));

const renderLogin = () => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/notes" element={<div>NOTES_PAGE</div>} />
        <Route path="/signup" element={<div>SIGNUP_PAGE</div>} />
        <Route path="/forgot-password" element={<div>FORGOT_PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Login', () => {
  beforeEach(() => {
    authState.loading = false;
    authState.error = null;
    mocks.dispatch.mockReset();
    mocks.loginUser.mockReset();
    mocks.clearError.mockReset();
    mocks.dispatch.mockImplementation((action) => action);
    mocks.loginUser.mockReturnValue({ unwrap: () => Promise.resolve({ success: true }) });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('navigates to the notes page after a successful sign in', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Email address'), 'musaddif@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('NOTES_PAGE')).toBeInTheDocument();
    expect(mocks.loginUser).toHaveBeenCalledWith({
      email: 'musaddif@example.com',
      password: 'Secret123',
    });
  });

  it('does not submit when a field is empty', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Email address'), 'musaddif@example.com');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mocks.loginUser).not.toHaveBeenCalled();
  });

  it('renders the server error message when login fails', async () => {
    authState.error = 'Invalid credentials';
    renderLogin();
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Toggle password visibility' }));
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('links to the sign up and forgot password pages', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeInTheDocument();
  });
});