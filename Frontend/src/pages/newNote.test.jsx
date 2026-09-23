// src/pages/newNote.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { configureStore } from '@reduxjs/toolkit';
import NewNotePage from './newNote';

const note = {
  id: 9,
  title: 'Existing Note',
  content: '<p>Existing content</p>',
  category: 'Work',
  tags: 'todo',
  theme: 'blue',
};

vi.mock('../store/thunk/noteThunk', () => ({
  createNote: vi.fn(() => () => ({ success: true, unwrap: () => Promise.resolve({ success: true }) })),
  updateNote: vi.fn(() => () => ({ success: true, unwrap: () => Promise.resolve({ success: true }) })),
  getNoteById: vi.fn((id) => ({ type: 'notes/getById', payload: { id } })),
}));

vi.mock('../store/slice/noteSlice', () => ({
  clearCurrentNote: vi.fn(() => ({ type: 'notes/clear' })),
}));

vi.mock('../store/thunk/aiThunk', () => ({
  checkGrammar: vi.fn(() => () => ({
    unwrap: () => Promise.resolve({ success: true, data: { originalText: 'My note body', correctedText: 'Corrected body' } }),
  })),
}));

vi.mock('../store/thunk/authThunk', () => ({
  logoutUser: vi.fn(() => ({ unwrap: () => Promise.resolve({}) })),
}));

vi.mock('../store/slice/authSlice', () => ({
  logout: vi.fn(() => ({ type: 'auth/mockLogout' })),
}));

vi.mock('../components/LogoutModal', () => ({
  default: () => null,
}));

vi.mock('../components/RichTextEditor', () => ({
  default: ({ value = '', onChange, placeholder }) => (
    <textarea
      data-testid="rich-text-editor"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

const notesReducer = (state = { currentNote: null, loading: false, error: null }, action) => {
  switch (action.type) {
    case 'notes/getById':
      return { ...state, currentNote: note };
    default:
      return state;
  }
};

const authReducer = (state = { user: { name: 'Test User', email: 'test@example.com' }, token: 'x' }) => state;

const renderNewNote = (initialEntry) => {
  const store = configureStore({
    reducer: { auth: authReducer, notes: notesReducer },
    preloadedState: {
      auth: { user: { name: 'Test User', email: 'test@example.com' }, token: 'x' },
      notes: { currentNote: null, loading: false, error: null },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/notes/new" element={<NewNotePage />} />
          <Route path="/notes/:id/edit" element={<NewNotePage />} />
          <Route path="/notes" element={<div data-testid="notes-page">Notes Page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('NewNotePage - create mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a note and navigates back to the notes list', async () => {
    const user = userEvent.setup();
    renderNewNote('/notes/new');
    expect(screen.getByRole('heading', { name: 'Create New Note' })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Title/), 'Test Title');
    await user.type(screen.getByTestId('rich-text-editor'), 'My note body');
    await user.click(screen.getByRole('button', { name: /Save Note/ }));

    const { createNote } = await import('../store/thunk/noteThunk');
    expect(createNote).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Test Title', content: 'My note body', category: 'Personal', theme: 'purple' })
    );
    expect(await screen.findByTestId('notes-page')).toBeInTheDocument();
  });

  it('blocks saving without a title or content', async () => {
    const user = userEvent.setup();
    renderNewNote('/notes/new');
    await user.click(screen.getByRole('button', { name: /Save Note/ }));

    expect(await screen.findByText(/Please add a title and note content/)).toBeInTheDocument();
    const { createNote } = await import('../store/thunk/noteThunk');
    expect(createNote).not.toHaveBeenCalled();
  });
});

describe('NewNotePage - edit mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and pre-fills the note, then updates it', async () => {
    const user = userEvent.setup();
    renderNewNote('/notes/9/edit');

    expect(screen.getByRole('heading', { name: 'Edit Note' })).toBeInTheDocument();

    const titleInput = await screen.findByDisplayValue('Existing Note');
    expect(titleInput).toBeInTheDocument();
    expect(screen.getByDisplayValue('<p>Existing content</p>')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('Work');

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Note');
    await user.click(screen.getByRole('button', { name: /Save Note/ }));

    const { updateNote } = await import('../store/thunk/noteThunk');
    expect(updateNote).toHaveBeenCalledWith(
      expect.objectContaining({ id: '9', noteData: expect.objectContaining({ title: 'Updated Note' }) })
    );
    expect(await screen.findByTestId('notes-page')).toBeInTheDocument();
  });
});

describe('NewNotePage - grammar check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the full note text and replaces the editor content with the corrected text', async () => {
    const user = userEvent.setup();
    renderNewNote('/notes/new');

    await user.type(screen.getByTestId('rich-text-editor'), 'My note body');
    await user.click(screen.getByRole('button', { name: /Check Grammar/ }));

    const { checkGrammar } = await import('../store/thunk/aiThunk');
    expect(checkGrammar).toHaveBeenCalledWith('My note body');
    expect(await screen.findByDisplayValue('Corrected body')).toBeInTheDocument();
    const { createNote } = await import('../store/thunk/noteThunk');
    expect(createNote).not.toHaveBeenCalled();
  });

  it('shows a validation message when the note is empty', async () => {
    const user = userEvent.setup();
    renderNewNote('/notes/new');

    await user.click(screen.getByRole('button', { name: /Check Grammar/ }));

    expect(await screen.findByText(/Please write some note content/)).toBeInTheDocument();
    const { checkGrammar } = await import('../store/thunk/aiThunk');
    expect(checkGrammar).not.toHaveBeenCalled();
  });

  it('shows an error and keeps the original text when the request fails', async () => {
    const user = userEvent.setup();
    const { checkGrammar } = await import('../store/thunk/aiThunk');
    checkGrammar.mockImplementationOnce(() => () => ({
      unwrap: () => Promise.reject('Failed to check grammar'),
    }));

    renderNewNote('/notes/new');
    await user.type(screen.getByTestId('rich-text-editor'), 'Original text');
    await user.click(screen.getByRole('button', { name: /Check Grammar/ }));

    expect(await screen.findByText('Failed to check grammar')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Original text')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check Grammar/ })).toBeEnabled();
  });
});