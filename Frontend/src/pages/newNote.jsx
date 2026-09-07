import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router";
import {
  ChevronDown, House, Menu, NotebookPen, Plus, Save, Tag, Trash2, UserRound, X, Eye,
  LogOut,
} from "lucide-react";
import { logoutUser } from "../store/thunk/authThunk";
import { logout } from "../store/slice/authSlice";
import { createNote, updateNote, getNoteById } from "../store/thunk/noteThunk";
import { clearCurrentNote } from "../store/slice/noteSlice";
import LogoutModal from "../components/LogoutModal";
import RichTextEditor from "../components/RichTextEditor";
import { sanitizeHtml } from "../utils/text";
import { categories } from "./notesData";
import "./Notes.css";
import "./NewNote.css";

const colors = ["purple", "blue", "green", "yellow", "red", "slate"];

function NoteForm({ currentNote, loading, saveError, onSave }) {
  const [title, setTitle] = useState(() => currentNote?.title || "");
  const [category, setCategory] = useState(() => currentNote?.category || "Personal");
  const [tags, setTags] = useState(() => currentNote?.tags || "");
  const [content, setContent] = useState(() => currentNote?.content || "");
  const [color, setColor] = useState(() => currentNote?.theme || "purple");
  const [submitted, setSubmitted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    onSave({
      title,
      content,
      category,
      tags,
      color,
      hasErrors: !title.trim() || !content.trim(),
    });
  };

  return (
    <form className="new-note-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field full-field">Title <span>*</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter note title..." aria-invalid={submitted && !title.trim()} /></label>
        <label className="field">Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
        <label className="field">Tags <small>(optional)</small><span className="input-with-icon"><Tag size={16} /><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Add tags (e.g. important, todo, work...)" /></span></label>
      </div>
        <div className="field content-field">
          <div className="field-label">Note Content <span>*</span></div>
          <div className="editor" aria-invalid={submitted && !content.trim()}>
            <RichTextEditor value={content} onChange={setContent} />
          </div>
        </div>
      <div className="note-options">
        <fieldset>
          <legend>Note Color</legend>
          <div className="color-options">
            {colors.map((item) => <button className={`color-swatch swatch-${item} ${color === item ? "selected" : ""}`} type="button" key={item} aria-label={`${item} note color`} onClick={() => setColor(item)} />)}
          </div>
        </fieldset>
      </div>
      <div className="form-actions">
        <button className="preview-button" type="button" onClick={() => setShowPreview((visible) => !visible)}><Eye size={16} /> {showPreview ? "Edit" : "Preview"}</button>
        <div><button className="cancel-button" type="button" onClick={() => onSave({ cancel: true })}>Cancel</button><button className="save-button" type="submit" disabled={loading}><Save size={16} /> {loading ? "Saving..." : "Save Note"}</button></div>
      </div>
      {showPreview && <div className={`note-preview note-card-${color}`}><h2>{title || "Untitled note"}</h2><div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) || "Your note preview will appear here." }} /></div>}
      {saveError && <p className="form-error" role="alert">{saveError}</p>}
      {submitted && (!title.trim() || !content.trim()) && <p className="form-error" role="alert">Please add a title and note content before saving.</p>}
    </form>
  );
}

function NewNotePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const { user } = useSelector((state) => state.auth || {});
  const { currentNote, loading, error } = useSelector((state) => state.notes || {});

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Load note if editing
  useEffect(() => {
    if (isEditing && id) {
      dispatch(getNoteById(id));
    }
    return () => {
      dispatch(clearCurrentNote());
    };
  }, [id, isEditing, dispatch]);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "user@example.com";

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap().catch(() => undefined);
    } catch (logoutError) {
      console.error("Server logout failed:", logoutError);
    } finally {
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  const handleSave = async (formData) => {
    if (formData.cancel) {
      navigate("/notes");
      return;
    }
    if (formData.hasErrors) {
      return;
    }
    setSaveError(null);

    const noteData = {
      title: formData.title.trim(),
      content: sanitizeHtml(formData.content),
      category: formData.category,
      tags: formData.tags.trim(),
      theme: formData.color,
    };

    try {
      if (isEditing) {
        const result = await dispatch(updateNote({ id, noteData })).unwrap();
        if (result.success) {
          navigate("/notes");
        }
      } else {
        const result = await dispatch(createNote(noteData)).unwrap();
        if (result.success) {
          navigate("/notes");
        }
      }
    } catch (saveErr) {
      setSaveError(saveErr || "Failed to save note");
      console.error("Save error:", saveErr);
    }
  };

  if (isEditing && loading) {
    return (
      <div className="notes-shell new-note-shell">
        <main className="notes-main new-note-main">
          <div className="loading-state"><p>Loading note...</p></div>
        </main>
      </div>
    );
  }

  return (
    <div className="notes-shell new-note-shell">
      <button className="mobile-menu-button icon-button" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
      {sidebarOpen && <button className="sidebar-overlay" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`notes-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><NotebookPen size={23} /></div><span>NoteNest</span><button className="mobile-close icon-button" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={19} /></button></div>
        <button className="new-note-button" type="button" onClick={() => navigate("/notes/new")}><Plus size={21} /> New Note</button>
        <nav className="sidebar-nav" aria-label="Notes navigation">
          <button className="nav-item" type="button" onClick={() => navigate("/notes")}><House size={18} /><span>All Notes</span></button>
          <button className="nav-item" type="button" onClick={() => navigate("/notes")}><Trash2 size={18} /><span>Trash</span></button>
        </nav>
        <div className="category-section"><p className="sidebar-label">Categories</p>{categories.map((item) => <button className="nav-item category-item" type="button" key={item.name} onClick={() => navigate("/notes")}><span className={`category-dot dot-${item.theme}`} /><span>{item.name}</span></button>)}</div>
        <div className="profile-area">
          <button className="profile-button" type="button" onClick={() => setLogoutModalOpen(true)} aria-label="Account menu">
            <span className="profile-avatar"><UserRound size={22} /></span><span className="profile-copy"><strong>{displayName}</strong><small>{displayEmail}</small></span><ChevronDown size={17} />
          </button>
          <button className="logout-button" type="button" onClick={() => setLogoutModalOpen(true)}><LogOut size={16} /> Log out</button>
        </div>
      </aside>
      {logoutModalOpen && <LogoutModal onCancel={() => setLogoutModalOpen(false)} onConfirm={handleLogout} />}

      <main className="notes-main new-note-main">
        <header className="new-note-heading"><div className="new-note-title"><NotebookPen size={25} /><h1>{isEditing ? "Edit Note" : "Create New Note"}</h1></div><div className="breadcrumbs"><House size={14} /> <button type="button" onClick={() => navigate("/notes")}>All Notes</button><span>/</span><span>{isEditing ? "Edit Note" : "New Note"}</span></div></header>
        <NoteForm
          key={currentNote?.id ?? "new"}
          currentNote={isEditing ? currentNote : null}
          loading={loading}
          saveError={saveError}
          onSave={handleSave}
        />
        {error && <p className="form-error" role="alert">Error: {error}</p>}
      </main>
    </div>
  );
}

export default NewNotePage;