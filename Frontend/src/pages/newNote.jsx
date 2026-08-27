import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router";
import {
  ChevronDown, House, Menu, NotebookPen, Plus, Save, Tag, Trash2, UserRound, X, Eye,
  LogOut,
} from "lucide-react";
import { logoutUser } from "../store/thunk/authThunk";
import { logout } from "../store/slice/authSlice";
import LogoutModal from "../components/LogoutModal";
import { categories, notes } from "./notesData";
import "./Notes.css";
import "./NewNote.css";

const colors = ["purple", "blue", "green", "yellow", "red", "slate"];

function NewNotePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const editingNote = id ? notes.find((note) => note.id === id) : null;
  const { user } = useSelector((state) => state.auth || {});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [title, setTitle] = useState(() => editingNote?.title || "");
  const [category, setCategory] = useState(() => editingNote?.category || "Personal");
  const [tags, setTags] = useState(() => editingNote?.tags || "");
  const [content, setContent] = useState(() => editingNote?.content || "");
  const [color, setColor] = useState(() => editingNote?.theme || "purple");
  const [location, setLocation] = useState("All Notes");
  const [showPreview, setShowPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const displayName = user?.name || "Ali Raza";
  const displayEmail = user?.email || "ali.raza@example.com";

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap().catch(() => undefined);
    } catch (error) {
      console.error("Server logout failed:", error);
    } finally {
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  const handleSave = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (!title.trim() || !content.trim()) return;
    navigate("/notes");
  };

  return (
    <div className="notes-shell new-note-shell">
      <button className="mobile-menu-button icon-button" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
      {sidebarOpen && <button className="sidebar-overlay" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`notes-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><NotebookPen size={23} /></div><span>NoteNest</span><button className="mobile-close icon-button" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={19} /></button></div>
        <button className="new-note-button" type="button" onClick={() => navigate("/notes/new")}><Plus size={21} /> New Note</button>
        <nav className="sidebar-nav" aria-label="Notes navigation">
          <button className="nav-item" type="button" onClick={() => navigate("/notes")}><House size={18} /><span>All Notes</span><strong>12</strong></button>
          <button className="nav-item" type="button"><Trash2 size={18} /><span>Trash</span><strong>2</strong></button>
        </nav>
        <div className="category-section"><p className="sidebar-label">Categories</p>{categories.map((item) => <button className="nav-item category-item" type="button" key={item.name} onClick={() => navigate("/notes")}><span className={`category-dot dot-${item.theme}`} /><span>{item.name}</span><strong>{item.count}</strong></button>)}</div>
        <div className="profile-area">
          <button className="profile-button" type="button" onClick={() => setLogoutModalOpen(true)} aria-label="Account menu">
            <span className="profile-avatar"><UserRound size={22} /></span><span className="profile-copy"><strong>{displayName}</strong><small>{displayEmail}</small></span><ChevronDown size={17} />
          </button>
          <button className="logout-button" type="button" onClick={() => setLogoutModalOpen(true)}><LogOut size={16} /> Log out</button>
        </div>
      </aside>
      {logoutModalOpen && <LogoutModal onCancel={() => setLogoutModalOpen(false)} onConfirm={handleLogout} />}

      <main className="notes-main new-note-main">
        <header className="new-note-heading"><div className="new-note-title"><NotebookPen size={25} /><h1>{editingNote ? "Edit Note" : "Create New Note"}</h1></div><div className="breadcrumbs"><House size={14} /> <button type="button" onClick={() => navigate("/notes")}>All Notes</button><span>/</span><span>{editingNote ? "Edit Note" : "New Note"}</span></div></header>
        <form className="new-note-form" onSubmit={handleSave}>
          <div className="form-grid">
            <label className="field full-field">Title <span>*</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter note title..." aria-invalid={submitted && !title.trim()} /></label>
            <label className="field">Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
            <label className="field">Tags <small>(optional)</small><span className="input-with-icon"><Tag size={16} /><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Add tags (e.g. important, todo, work...)" /></span></label>
          </div>
            <div className="field content-field">
              <div className="field-label">Note Content <span>*</span></div>
              <div className="editor" aria-invalid={submitted && !content.trim()}>
                               <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write your note here..." />
              </div>
            </div>
          <div className="note-options">
            <fieldset>
              <legend>Note Color</legend>
              <div className="color-options">
                {colors.map((item) => <button className={`color-swatch swatch-${item} ${color === item ? "selected" : ""}`} type="button" key={item} aria-label={`${item} note color`} onClick={() => setColor(item)} />)}
              </div>
            </fieldset>
            <label className="field save-location">Save Location
              <select value={location} onChange={(event) => setLocation(event.target.value)}>
                <option>All Notes</option><option>Personal</option><option>Work</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button className="preview-button" type="button" onClick={() => setShowPreview((visible) => !visible)}><Eye size={16} /> {showPreview ? "Edit" : "Preview"}</button>
            <div><button className="cancel-button" type="button" onClick={() => navigate("/notes")}>Cancel</button><button className="save-button" type="submit"><Save size={16} /> Save Note</button></div>
          </div>
          {showPreview && <div className={`note-preview note-card-${color}`}><h2>{title || "Untitled note"}</h2><p>{content || "Your note preview will appear here."}</p></div>}
          {submitted && (!title.trim() || !content.trim()) && <p className="form-error" role="alert">Please add a title and note content before saving.</p>}
        </form>
      </main>
    </div>
  );
}

export default NewNotePage;
