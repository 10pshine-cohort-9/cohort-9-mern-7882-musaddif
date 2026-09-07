import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, CalendarDays, Clock3, Edit3, Tag } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { getNoteById } from "../store/thunk/noteThunk";
import { clearCurrentNote } from "../store/slice/noteSlice";
import { sanitizeHtml } from "../utils/text";
import "./NoteDetails.css";

function NoteDetails() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { currentNote, loading, error } = useSelector((state) => state.notes || {});

  useEffect(() => {
    if (id) {
      dispatch(getNoteById(id));
    }
    return () => {
      dispatch(clearCurrentNote());
    };
  }, [id, dispatch]);

  if (loading) {
    return (
      <main className="details-missing">
        <p>Loading note...</p>
      </main>
    );
  }

  if (error || !currentNote) {
    return (
      <main className="details-missing">
        <p>{error ? `Error: ${error}` : "Note not found."}</p>
        <button type="button" onClick={() => navigate("/notes")}>Back to All Notes</button>
      </main>
    );
  }

  const note = currentNote;
  // Map category to icon for display
  const getCategoryIcon = (categoryName) => {
    const categoryMap = {
      'Personal': '💜',
      'Work': '💼',
      'Study': '📚',
      'Ideas': '💡',
      'Others': '📁',
    };
    return categoryMap[categoryName] || '📝';
  };

  return (
    <main className={`note-details note-card-${note.theme}`}>
      <div className="details-topbar">
        <button className="details-back" type="button" onClick={() => navigate("/notes")}>
          <ArrowLeft size={17} /> Back to All Notes
        </button>
        <button className="details-edit" type="button" onClick={() => navigate(`/notes/${note.id}/edit`)}>
          <Edit3 size={16} /> Edit Note
        </button>
      </div>
      <article className="details-paper">
        <div className={`details-icon note-icon-${note.theme}`}>
          {getCategoryIcon(note.category)}
        </div>
        <div className="details-heading">
          <span className={`note-tag note-tag-${note.theme}`}>{note.category}</span>
          <h1>{note.title}</h1>
        </div>
        <div className="details-meta">
          <span><CalendarDays size={15} /> Created: {new Date(note.createdAt).toLocaleString()}</span>
          <span><Clock3 size={15} /> Updated: {new Date(note.updatedAt).toLocaleString()}</span>
          {note.tags && <span><Tag size={15} /> {note.tags}</span>}
        </div>
        <div className="details-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }} />
      </article>
    </main>
  );
}

export default NoteDetails;
