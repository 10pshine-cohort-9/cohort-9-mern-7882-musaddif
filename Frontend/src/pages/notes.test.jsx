// src/pages/notes.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { configureStore } from '@reduxjs/toolkit';
import NotesPage from './notes';

const dataset = [
  { id: 1, title: 'Project Ideas', content: '<p>Hackathon plans for the weekend</p>', category: 'Ideas', theme: 'yellow', isTrashed: false, contentPreview: 'Hackathon plans for the weekend' },
  { id: 2, title: 'Work Tasks', content: '<p>Review PRD before demo</p>', category: 'Work', theme: 'blue', isTrashed: false, contentPreview: 'Review PRD before demo' },
  { id: 3, title: 'Grocery Run', content: '<p>Milk and eggs</p>', category: 'Personal', theme: 'purple', isTrashed: false, contentPreview: 'Milk and eggs' },
  { id: 4, title: 'Old Ideas', content: '<p>Long archived brainstorm</p>', category: 'Ideas', theme: 'yellow', isTrashed: true, contentPreview: 'Long archived brainstorm' },
  { id: 5, title: 'Old Work', content: '<p>Something to delete</p>', category: 'Work', theme: 'blue', isTrashed: true, contentPreview: 'Something to delete' },
];

const emptyCounts = { total: 0, active: 0, trashed: 0, byCategory: {} };

// Simulates the server: filters by scope/category/q, paginates with an opaque
// page cursor, and reports counts.
vi.mock('../store/thunk/noteThunk', () => {
  const buildCounts = (notes) => {
    const byCategory = {};
    notes.forEach((note) => {
      if (!note.isTrashed) {
        byCategory[note.category] = (byCategory[note.category] || 0) + 1;
      }
    });
    return {
      total: notes.length,
      active: notes.filter((note) => !note.isTrashed).length,
      trashed: notes.filter((note) => note.isTrashed).length,
      byCategory,
    };
  };

  return {
    getNotes: vi.fn((params = {}) => {
      const { scope = 'active', category, q, cursor, limit = 2 } = params;
      let list = dataset.filter((note) => (scope === 'trash' ? note.isTrashed : !note.isTrashed));
      if (category) list = list.filter((note) => note.category === category);
      if (q) {
        const query = q.toLowerCase();
        list = list.filter((note) =>
          `${note.title} ${note.contentPreview} ${note.category}`.toLowerCase().includes(query)
        );
      }
      const page = cursor ? parseInt(cursor, 10) : 0;
      const slice = list.slice(page * limit, page * limit + limit);
      const hasMore = page * limit + limit < list.length;
      return {
        type: 'notes/load',
        payload: {
          notes: slice,
          pagination: { limit, hasMore, nextCursor: hasMore ? String(page + 1) : null },
          counts: buildCounts(dataset),
        },
        meta: { arg: params },
      };
    }),
    trashNote: vi.fn((id) => ({ type: 'notes/trash', payload: id })),
    restoreNote: vi.fn((id) => ({ type: 'notes/restore', payload: id })),
    deleteNote: vi.fn((id) => ({ type: 'notes/delete', payload: id })),
  };
});

vi.mock('../store/thunk/authThunk', () => ({
  logoutUser: vi.fn(() => ({ type: 'auth/mockLogout' })),
}));

const notesReducer = (
  state = { notes: [], loading: false, loadingMore: false, error: null, pagination: { hasMore: false, nextCursor: null }, counts: emptyCounts },
  action
) => {
  switch (action.type) {
    case 'notes/load': {
      const payload = action.payload || { notes: [], pagination: { hasMore: false, nextCursor: null }, counts: emptyCounts };
      const append = Boolean(action.meta?.arg?.cursor);
      return {
        ...state,
        loading: false,
        loadingMore: false,
        notes: append ? [...state.notes, ...payload.notes] : payload.notes,
        pagination: payload.pagination,
        counts: payload.counts || state.counts,
      };
    }
    case 'notes/trash':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.payload) };
    case 'notes/restore':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.payload) };
    case 'notes/delete':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.payload) };
    default:
      return state;
  }
};

const authReducer = (state = { user: { name: 'Test User', email: 'test@example.com' }, token: 'x' }) => state;

const renderNotesPage = () => {
  const store = configureStore({
    reducer: { auth: authReducer, notes: notesReducer },
    preloadedState: {
      auth: { user: { name: 'Test User', email: 'test@example.com' }, token: 'x' },
      notes: { notes: [], loading: false, loadingMore: false, error: null, pagination: { hasMore: false, nextCursor: null }, counts: emptyCounts },
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders non-trashed notes from the server in the All Notes view', () => {
    renderNotesPage();
    expect(screen.getByRole('heading', { name: 'All Notes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project Ideas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Work Tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Old Ideas' })).not.toBeInTheDocument();
  });

  it('debounces the search query and refetches from the server', async () => {
    vi.useFakeTimers();
    renderNotesPage();
    expect(screen.getByRole('heading', { name: 'Project Ideas' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: /search/i }), { target: { value: 'PRD' } });
    // Within the debounce window the current (unfiltered) result is still shown.
    expect(screen.getByRole('heading', { name: 'Project Ideas' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(screen.getByRole('heading', { name: 'Work Tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Project Ideas' })).not.toBeInTheDocument();
  });

  it('shows only trashed notes in the Trash view', async () => {
    const user = userEvent.setup();
    renderNotesPage();
    await user.click(screen.getByRole('button', { name: /trash/i }));
    expect(screen.getByRole('heading', { name: 'Trash' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Old Ideas' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Project Ideas' })).not.toBeInTheDocument();
  });

  it('filters by category server-side', async () => {
    const user = userEvent.setup();
    renderNotesPage();
    await user.click(screen.getByRole('button', { name: /^ideas/i }));
    expect(screen.getByRole('heading', { name: 'Project Ideas' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Work Tasks' })).not.toBeInTheDocument();
  });

  it('loads more notes when there is a next page', async () => {
    const user = userEvent.setup();
    renderNotesPage();
    expect(screen.getByRole('heading', { name: 'Project Ideas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Work Tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Grocery Run' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /load more notes/i }));
    expect(await screen.findByRole('heading', { name: 'Grocery Run' })).toBeInTheDocument();
  });

  it('removes a trash note from the trash list on permanent delete', async () => {
    const user = userEvent.setup();
    renderNotesPage();
    await user.click(screen.getByRole('button', { name: /trash/i }));
    await user.click(await screen.findByRole('button', { name: 'Options for Old Ideas' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));
    expect(screen.queryByRole('heading', { name: 'Old Ideas' })).not.toBeInTheDocument();
  });

  it('restores a trashed note and removes it from the trash list', async () => {
    const user = userEvent.setup();
    renderNotesPage();
    await user.click(screen.getByRole('button', { name: /trash/i }));
    await user.click(await screen.findByRole('button', { name: 'Options for Old Ideas' }));
    await user.click(screen.getByRole('menuitem', { name: 'Restore' }));
    expect(screen.queryByRole('heading', { name: 'Old Ideas' })).not.toBeInTheDocument();
  });

  it('shows the loading state while notes are being fetched', async () => {
    const { getNotes } = await import('../store/thunk/noteThunk');
    getNotes.mockImplementation(() => ({ type: 'notes/noop' }));
    const store = configureStore({
      reducer: { auth: authReducer, notes: notesReducer },
      preloadedState: {
        auth: { user: { name: 'Test User', email: 'test@example.com' }, token: 'x' },
        notes: { notes: [], loading: true, loadingMore: false, error: null, pagination: { hasMore: false, nextCursor: null }, counts: emptyCounts },
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
        notes: { notes: [], loading: false, loadingMore: false, error: 'Failed to fetch notes', pagination: { hasMore: false, nextCursor: null }, counts: emptyCounts },
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

  it('shows an empty state when the server returns no notes', async () => {
    const { getNotes } = await import('../store/thunk/noteThunk');
    getNotes.mockImplementation(() => ({
      type: 'notes/load',
      payload: { notes: [], pagination: { hasMore: false, nextCursor: null }, counts: emptyCounts },
      meta: { arg: {} },
    }));
    const store = configureStore({
      reducer: { auth: authReducer, notes: notesReducer },
      preloadedState: {
        auth: { user: { name: 'Test User', email: 'test@example.com' }, token: 'x' },
        notes: { notes: [], loading: false, loadingMore: false, error: null, pagination: { hasMore: false, nextCursor: null }, counts: emptyCounts },
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <NotesPage />
        </MemoryRouter>
      </Provider>
    );
    expect(await screen.findByText(/No notes match your search/)).toBeInTheDocument();
  });
});