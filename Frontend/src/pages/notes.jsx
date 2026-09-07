import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import {
  ChevronDown, Coffee, House, Menu, NotebookPen,
  LogOut, Plus, Search, Trash2, UserRound, X,
} from "lucide-react";
import { logoutUser } from "../store/thunk/authThunk";
import { logout } from "../store/slice/authSlice";
import { getNotes, trashNote, restoreNote, deleteNote } from "../store/thunk/noteThunk";
import NoteCard from "../components/NoteCard";
import LogoutModal from "../components/LogoutModal";
import { stripHtml } from "../utils/text";
import { categories } from "./notesData";
import "./Notes.css";

function NotesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const { notes, loading, error } = useSelector((state) => state.notes || { notes: [], loading: false, error: null });
  
  const [activeCategory, setActiveCategory] = useState("All Notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Load notes on component mount
  useEffect(() => {
    dispatch(getNotes());
  }, [dispatch]);

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

  const filteredNotes = useMemo(() => notes.filter((note) => {
    const matchesLocation = activeCategory === "Trash" ? note.isTrashed : !note.isTrashed;
    const matchesCategory = activeCategory === "All Notes" || activeCategory === "Trash" || note.category === activeCategory;
    const query = searchQuery.trim().toLowerCase();
    return matchesLocation && matchesCategory && (!query || `${note.title} ${stripHtml(note.content)} ${note.category}`.toLowerCase().includes(query));
  }), [activeCategory, notes, searchQuery]);

  const moveToTrash = (noteId) => {
    dispatch(trashNote(noteId));
  };

  const restoreNoteHandler = (noteId) => {
    dispatch(restoreNote(noteId));
  };

  const deletePermanently = (noteId) => {
    dispatch(deleteNote(noteId));
  };

  const handleProfileUpload = (event) => {
    const [file] = event.target.files;
    if (file) setProfileImage(URL.createObjectURL(file));
  };

  const displayName = user?.name;
  const displayEmail = user?.email;

  // Map API category names to icon/theme from notesData
  const getCategoryData = (categoryName) => {
    return categories.find(c => c.name === categoryName) || { name: categoryName, theme: 'purple', icon: null };
  };

  return (
    <div className="notes-shell">
      <button className="mobile-menu-button icon-button" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
      {sidebarOpen && <button className="sidebar-overlay" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`notes-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="brand"><div className="brand-mark">
          <NotebookPen size={23} /></div><span>NoteNest</span>
          <button className="mobile-close icon-button" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={19} />
          </button></div>
        <button className="new-note-button" type="button" onClick={() => navigate("/notes/new")}><Plus size={21} /> New Note</button>
        <nav className="sidebar-nav" aria-label="Notes navigation">
          <button className={`nav-item ${activeCategory === "All Notes" ? "active" : ""}`} type="button" onClick={() => { setActiveCategory("All Notes"); setSidebarOpen(false); }}>
            <House size={18} /><span>All Notes</span><strong>{notes.filter((note) => !note.isTrashed).length}</strong></button>
          <button className={`nav-item ${activeCategory === "Trash" ? "active" : ""}`} type="button" onClick={() => { setActiveCategory("Trash"); setSidebarOpen(false); }}>
            <Trash2 size={18} /><span>Trash</span><strong>{notes.filter((note) => note.isTrashed).length}</strong></button>
        </nav>
        <div className="category-section"><p className="sidebar-label">Categories</p>{categories.map((category) => {
          const CategoryIcon = category.icon;
          const categoryCount = notes.filter(n => n.category === category.name && !n.isTrashed).length;
          return <button className={`nav-item category-item ${activeCategory === category.name ? "active" : ""}`} type="button" key={category.name} onClick={() => { setActiveCategory(category.name); setSidebarOpen(false); }}><span className={`category-dot dot-${category.theme}`} /><span><CategoryIcon size={15} className="category-icon" />{category.name}</span><strong>{categoryCount}</strong></button>;
        })}</div>
        <div className="profile-area">
          <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleProfileUpload} />
          <button className="profile-button" type="button" onClick={() => fileInputRef.current?.click()} aria-label="Change profile image">
            <span className="profile-avatar">{profileImage ? <img src={profileImage} alt="Profile" /> : <UserRound size={22} />}</span>
            <span className="profile-copy"><strong>{displayName}</strong><small>{displayEmail}</small></span><ChevronDown size={17} />
          </button>
          <button className="logout-button" type="button" onClick={() => setLogoutModalOpen(true)}><LogOut size={16} /> Log out</button>
        </div>
      </aside>
      {logoutModalOpen && <LogoutModal onCancel={() => setLogoutModalOpen(false)} onConfirm={handleLogout} />}
      <main className="notes-main">
        <header className="notes-header"><div className="search-wrap"><Search size={19} />
          <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search your notes..." aria-label="Search your notes" /></div></header>
        <section className="notes-content">
          <div className="page-heading">
            <h1>{activeCategory}</h1>
            <p>{filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}</p></div>
          {loading && <div className="loading-state"><p>Loading notes...</p></div>}
          {error && <div className="error-state"><p>Error: {error}</p></div>}
          <div className="notes-grid">{filteredNotes.map((note) => {
            const categoryData = getCategoryData(note.category);
            return <NoteCard note={{ ...note, icon: categoryData.icon }} key={note.id} isTrashView={activeCategory === "Trash"} onTrash={moveToTrash} onRestore={restoreNoteHandler} onDeletePermanently={deletePermanently} />
          })}</div>{filteredNotes.length === 0 && !loading &&
              <div className="empty-state">
                <Coffee size={22} />
                <p>{activeCategory === "Trash" ? "Trash is empty." : "No notes match your search."}</p></div>}
        </section>
      </main>
    </div>
  );
}

export default NotesPage;
