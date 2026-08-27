import { ArrowLeft, CalendarDays, Clock3, Edit3, Tag } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { notes } from "./notesData";
import "./NoteDetails.css";

function NoteDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const note = notes.find((item) => item.id === id);

  if (!note) return <main className="details-missing"><p>Note not found.</p><button type="button" onClick={() => navigate("/notes")}>Back to All Notes</button></main>;
  const Icon = note.icon;

  return <main className={`note-details note-card-${note.theme}`}>
    <div className="details-topbar"><button className="details-back" type="button" onClick={() => navigate("/notes")}><ArrowLeft size={17} /> Back to All Notes</button><button className="details-edit" type="button" onClick={() => navigate(`/notes/${note.id}/edit`)}><Edit3 size={16} /> Edit Note</button></div>
    <article className="details-paper">
      <div className={`details-icon note-icon-${note.theme}`}><Icon size={29} /></div>
      <div className="details-heading"><span className={`note-tag note-tag-${note.theme}`}>{note.category}</span><h1>{note.title}</h1></div>
      <div className="details-meta"><span><CalendarDays size={15} /> Created: {note.createdAt}</span><span><Clock3 size={15} /> Updated: {note.updatedAt}</span>{note.tags && <span><Tag size={15} /> {note.tags}</span>}</div>
      <div className="details-content">{note.content}</div>
    </article>
  </main>;
}

export default NoteDetails;
