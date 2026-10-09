// src/components/NoteCard.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import NoteCard from './NoteCard';

const baseNote = {
  id: 1,
  title: 'Grocery List',
  content: '<p>Buy <strong>milk</strong> and eggs</p>',
  category: 'Personal',
  theme: 'purple',
  icon: () => <span data-testid="note-icon" />,
};

const renderNoteCard = (props = {}) => {
  return render(
    <MemoryRouter>
      <NoteCard note={baseNote} {...props} />
    </MemoryRouter>
  );
};

describe('NoteCard', () => {
  it('renders the note title and a plain-text content preview', () => {
    renderNoteCard();
    expect(screen.getByRole('heading', { name: 'Grocery List' })).toBeInTheDocument();
    expect(screen.getByText(/Buy milk and eggs/)).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('shows Edit and Trash actions for a normal note', async () => {
    const user = userEvent.setup();
    renderNoteCard({ onTrash: vi.fn(), onRestore: vi.fn(), onDeletePermanently: vi.fn() });
    await user.click(screen.getByRole('button', { name: /Options for Grocery List/ }));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Trash' })).toBeInTheDocument();
  });

  it('shows Restore and Delete actions in trash view', async () => {
    const user = userEvent.setup();
    renderNoteCard({ isTrashView: true, onTrash: vi.fn(), onRestore: vi.fn(), onDeletePermanently: vi.fn() });
    await user.click(screen.getByRole('button', { name: /Options for Grocery List/ }));
    expect(screen.getByRole('menuitem', { name: 'Restore' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('calls onDeletePermanently when confirming permanent delete', async () => {
    const user = userEvent.setup();
    const onDeletePermanently = vi.fn();
    renderNoteCard({ isTrashView: true, onTrash: vi.fn(), onRestore: vi.fn(), onDeletePermanently });
    await user.click(screen.getByRole('button', { name: /Options for Grocery List/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));
    expect(onDeletePermanently).toHaveBeenCalledWith(1);
  });

  it('moves a note to trash when confirming from the normal view', async () => {
    const user = userEvent.setup();
    const onTrash = vi.fn();
    renderNoteCard({ onTrash, onRestore: vi.fn(), onDeletePermanently: vi.fn() });
    await user.click(screen.getByRole('button', { name: /Options for Grocery List/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Trash' }));
    expect(screen.getByRole('heading', { name: 'Move to trash?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Move to trash' }));
    expect(onTrash).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancels the delete confirmation without calling handlers', async () => {
    const user = userEvent.setup();
    const onTrash = vi.fn();
    const onDeletePermanently = vi.fn();
    renderNoteCard({ onTrash, onRestore: vi.fn(), onDeletePermanently });
    await user.click(screen.getByRole('button', { name: /Options for Grocery List/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Trash' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onTrash).not.toHaveBeenCalled();
    expect(onDeletePermanently).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navigates to the edit page when Edit is chosen', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<NoteCard note={baseNote} onTrash={vi.fn()} onRestore={vi.fn()} onDeletePermanently={vi.fn()} />} />
          <Route path="/notes/1/edit" element={<div>EDIT_PAGE</div>} />
        </Routes>
      </MemoryRouter>
    );
    await user.click(screen.getByRole('button', { name: /Options for Grocery List/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(await screen.findByText('EDIT_PAGE')).toBeInTheDocument();
  });
});