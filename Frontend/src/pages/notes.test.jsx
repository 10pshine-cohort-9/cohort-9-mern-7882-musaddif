// src/pages/notes.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { configureStore } from '@reduxjs/toolkit';
import NotesPage from './notes';

const mockNotes = [
  { id: 1, title: 'Project Ideas', content: '<p>Hackathon plans</p>', category: 'Ideas', theme: 'yellow', isTrashed: false, time: '2 mins ago' },
  { id: 2, title: 'Work Tasks', content: '<p>Review PRD</p>', category: 'Work', theme: 'blue', isTrashed: false, time: '1 hour ago' },
  { id: 3, title: 'Old Notes', content: '<p>Archive me</p>', category: 'Study', theme: 'green', isTrashed: true, time: 'yesterday' },
];

vi.mock('../store/thunk/noteThunk', () => ({
  getNotes: vi.fn(() => ({ type: 'notes/load', payload: mockNotes })),
  trashNote: vi.fn((id) => ({ type: 'notes/trash', payload: id })),
  restoreNote: vi.fn((id) => ({ type: 'notes/restore', payload: id })),
  deleteNote: vi.fn((id) => ({ type: 'notes/delete', payload: id })),
}));

vi.mock('../store/thunk/authThunk', () => ({
  logoutUser: vi.fn(() => ({ type: 'auth/mockLogout' })),
}));

const notesReducer = (state = { notes: [], loading: false, error: null }, action) => {
  switch (action.type) {
    case 'notes/load':
      return { ...state, notes: action.payload, loading: false };
    case 'notes/trash':
      return { ...state, notes: state.notes.map((n) => (n.id === action.payload ? { ...n, isTrashed: true } : n)) };
    case 'notes/restore':
      return { ...state, notes: state.notes.map((n) => (n.id === action.payload ? { ...n, isTrashed: false } : n)) };
    case 'notes/delete':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.payload) };
    default:
      return state;
  }
};

const authReducer = (state = { user: { name: 'Test User', email: 'test@example.com' }, token: 'x' }) => state;

const renderNotesPage = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      notes: notesReducer,
    },
    preloadedState: {
      auth: { user: { name: 'Test User', email: 'test@example.com' }, token: 'x' },
      notes: { notes: mockNotes, loading: false, error: null },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <NotesPage />
      </MemoryRouter>
    </Provider>
  );
};

describe('NotesPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders non-trashed notes in the All Notes view', () => {
    renderNotesPage();
    expect(screen.getByRole('heading', { name: 'All Notes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project Ideas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Work Tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Old Notes' })).not.toBeInTheDocument();
  });

  it('filters notes by the search query', async () => {
    const user = userEvent.setup();
    renderNotesPage();
    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'PRD');
    expect(screen.getByRole('heading', { name: 'Work Tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Project Ideas' })).not.toBeInTheDocument();
  });

  it('shows only trashed notes in the Trash view', async () => {
    const user = userEvent.setup();
    renderNotesPage();
    await user.click(screen.getByRole('button', { name: /trash/i }));
    expect(screen.getByRole('heading', { name: 'Trash' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Old Notes' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Project Ideas' })).not.toBeInTheDocument();
  });

  it('removes a trash note from the trash list on permanent delete', async () => {
    const user = userEvent.setup();
    renderNotesPage();
    await user.click(screen.getByRole('button', { name: /trash/i }));
    await user.click(screen.getByRole('button', { name: 'Options for Old Notes' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));
    expect(screen.queryByRole('heading', { name: 'Old Notes' })).not.toBeInTheDocument();
  });

  it('restores a trashed note and removes it from the trash list', async () => {
    const user = userEvent.setup();
    renderNotesPage();
    await user.click(screen.getByRole('button', { name: /trash/i }));
    await user.click(screen.getByRole('button', { name: 'Options for Old Notes' }));
    await user.click(screen.getByRole('menuitem', { name: 'Restore' }));
    expect(screen.queryByRole('heading', { name: 'Old Notes' })).not.toBeInTheDocument();
  });

  it('shows the loading state while notes are being fetched', async () => {
    const { getNotes } = await import('../store/thunk/noteThunk');
    getNotes.mockImplementation(() => ({ type: 'notes/noop' }));
    const store = configureStore({
      reducer: { auth: authReducer, notes: notesReducer },
      preloadedState: {
        auth: { user: { name: 'Test User', email: 'test@example.com' }, token: 'x' },
        notes: { notes: [], loading: true, error: null },
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <NotesPage />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/Loading notes/)).toBeInTheDocument();
  });

  it('shows an error message when loading notes fails', () => {
    const store = configureStore({
      reducer: { auth: authReducer, notes: notesReducer },
      preloadedState: {
        auth: { user: { name: 'Test User', email: 'test@example.com' }, token: 'x' },
        notes: { notes: [], loading: false, error: 'Failed to fetch notes' },
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <NotesPage />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/Error: Failed to fetch notes/)).toBeInTheDocument();
  });

  it('shows an empty state when there are no notes', async () => {
    const { getNotes } = await import('../store/thunk/noteThunk');
    getNotes.mockImplementation(() => ({ type: 'notes/load', payload: [] }));
    const store = configureStore({
      reducer: { auth: authReducer, notes: notesReducer },
      preloadedState: {
        auth: { user: { name: 'Test User', email: 'test@example.com' }, token: 'x' },
        notes: { notes: [], loading: false, error: null },
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <NotesPage />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/No notes match your search/)).toBeInTheDocument();
  });
});