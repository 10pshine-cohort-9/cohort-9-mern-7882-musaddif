import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

function NoteCard({ note, isTrashView = false, onTrash, onRestore, onDeletePermanently }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const navigate = useNavigate();
  const Icon = note.icon;

  return (
    <article className={`note-card note-card-${note.theme}`}
     onClick={() => navigate(`/notes/${note.id}`)} role="button" tabIndex="0" 
     onKeyDown={(event) => { if (event.key === "Enter") navigate(`/notes/${note.id}`); }}>
      <div className="note-card-topline">
        <div className={`note-icon note-icon-${note.theme}`}>
          <Icon size={24} strokeWidth={2.25} />
        </div>
        <div className="note-menu-wrap">
          <button
            className="icon-button note-menu-button"
            type="button"
            aria-label={`Options for ${note.title}`}
            aria-expanded={menuOpen}
            onClick={(event) => { event.stopPropagation(); setMenuOpen((isOpen) => !isOpen); }}
          >
            <MoreHorizontal size={19} />
          </button>
          {menuOpen && (
            <div className="note-menu" role="menu">
              {isTrashView ? <>
                <button type="button" role="menuitem" onClick={(event) => { event.stopPropagation(); onRestore(note.id); setMenuOpen(false); }}>Restore</button>
                <button type="button" role="menuitem" onClick={(event) => { event.stopPropagation(); setMenuOpen(false); setConfirmingDelete(true); }}>Delete</button>
              </> : <>
                <button type="button" role="menuitem" onClick={(event) => { event.stopPropagation(); navigate(`/notes/${note.id}/edit`); }}>Edit</button>
                <button type="button" role="menuitem" onClick={(event) => { event.stopPropagation(); setMenuOpen(false); setConfirmingDelete(true); }}>Trash</button>
              </>}
            </div>
          )}
        </div>
      </div>
      <h2>{note.title}</h2>
      <p className="note-description">{note.content}</p>
      <div className="note-card-footer">
        <span className={`note-tag note-tag-${note.theme}`}>{note.category}</span>
        <time>{note.time}</time>
      </div>
      {confirmingDelete && <div className="delete-modal-backdrop" role="presentation" onClick={(event) => event.stopPropagation()}><div className="delete-modal" role="dialog" aria-modal="true" aria-labelledby={`delete-${note.id}`}><h2 id={`delete-${note.id}`}>{isTrashView ? "Delete permanently?" : "Move to trash?"}</h2><p>{isTrashView ? "This note will be deleted permanently and cannot be recovered." : "The note will be moved to trash."}</p><div><button type="button" onClick={() => setConfirmingDelete(false)}>Cancel</button><button className="delete-confirm" type="button" onClick={() => { if (isTrashView) onDeletePermanently(note.id); else onTrash(note.id); setConfirmingDelete(false); }}> {isTrashView ? "Delete permanently" : "Move to trash"}</button></div></div></div>}
    </article>
  );
}

export default NoteCard;