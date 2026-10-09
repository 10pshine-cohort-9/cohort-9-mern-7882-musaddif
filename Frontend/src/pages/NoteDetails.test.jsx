// src/pages/NoteDetails.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { configureStore } from '@reduxjs/toolkit';
import NoteDetails from './NoteDetails';

const note = {
  id: 5,
  title: 'Meeting Notes',
  content: '<p>Discuss <strong>roadmap</strong></p>',
  category: 'Work',
  tags: 'important, todo',
  theme: 'blue',
  createdAt: '2026-01-02T10:00:00.000Z',
  updatedAt: '2026-01-03T10:00:00.000Z',
};

vi.mock('../store/thunk/noteThunk', () => ({
  getNoteById: vi.fn((id) => ({ type: 'notes/getById', payload: { id } })),
}));

vi.mock('../store/slice/noteSlice', () => ({
  clearCurrentNote: vi.fn(() => ({ type: 'notes/clear' })),
}));

const notesReducer = (state = { currentNote: null, loading: false, error: null }, action) => {
  switch (action.type) {
    case 'notes/getById':
      return { ...state, loading: false, currentNote: note };
    default:
      return state;
  }
};

const renderNoteDetails = (preloadedNotes) => {
  const store = configureStore({
    reducer: { notes: notesReducer },
    preloadedState: { notes: preloadedNotes },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/notes/5']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
          <Route path="/notes/:id/edit" element={<div data-testid="edit-page">Edit Page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('NoteDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while the note is being fetched', async () => {
    const { getNoteById } = await import('../store/thunk/noteThunk');
    getNoteById.mockImplementationOnce(() => ({ type: 'notes/noop' }));
    renderNoteDetails({ currentNote: null, loading: true, error: null });
    expect(screen.getByText(/Loading note/)).toBeInTheDocument();
  });

  it('shows an error message when loading fails', () => {
    renderNoteDetails({ currentNote: null, loading: false, error: 'Not found' });
    expect(screen.getByText(/Error: Not found/)).toBeInTheDocument();
    expect(screen.getByText(/Back to All Notes/)).toBeInTheDocument();
  });

  it('renders the note title, category, metadata and sanitized content', () => {
    renderNoteDetails({ currentNote: note, loading: false, error: null });
    expect(screen.getByRole('heading', { name: 'Meeting Notes' })).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText(/important, todo/)).toBeInTheDocument();
    const content = document.querySelector('.details-content');
    expect(content.innerHTML).toContain('<strong>roadmap</strong>');
  });

  it('navigates to the edit page when Edit Note is clicked', async () => {
    const user = userEvent.setup();
    renderNoteDetails({ currentNote: note, loading: false, error: null });
    expect(screen.queryByTestId('edit-page')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Edit Note/ }));
    expect(screen.getByTestId('edit-page')).toBeInTheDocument();
  });
});