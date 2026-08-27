import { useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import {
  ChevronDown, Coffee, House, Menu, NotebookPen,
  LogOut, Plus, Search, Trash2, UserRound, X,
} from "lucide-react";
import { logoutUser } from "../store/thunk/authThunk";
import { logout } from "../store/slice/authSlice";
import NoteCard from "../components/NoteCard";
import LogoutModal from "../components/LogoutModal";
import { categories, notes } from "./notesData";
import "./Notes.css";

function NotesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const [activeCategory, setActiveCategory] = useState("All Notes");
  const [noteList, setNoteList] = useState(notes);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const fileInputRef = useRef(null);

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

  const filteredNotes = useMemo(() => noteList.filter((note) => {
    const matchesLocation = activeCategory === "Trash" ? note.isTrashed : !note.isTrashed;
    const matchesCategory = activeCategory === "All Notes" || activeCategory === "Trash" || note.category === activeCategory;
    const query = searchQuery.trim().toLowerCase();
    return matchesLocation && matchesCategory && (!query || `${note.title} ${note.content} ${note.category}`.toLowerCase().includes(query));
  }), [activeCategory, noteList, searchQuery]);

  const moveToTrash = (noteId) => {
    setNoteList((currentNotes) => currentNotes.map((note) => note.id === noteId ? { ...note, isTrashed: true } : note));
  };

  const restoreNote = (noteId) => {
    setNoteList((currentNotes) => currentNotes.map((note) => note.id === noteId ? { ...note, isTrashed: false } : note));
  };

  const deletePermanently = (noteId) => {
    setNoteList((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
  };

  const handleProfileUpload = (event) => {
    const [file] = event.target.files;
    if (file) setProfileImage(URL.createObjectURL(file));
  };

  const displayName = user?.name ;
  const displayEmail = user?.email ;

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
            <House size={18} /><span>All Notes</span><strong>{noteList.filter((note) => !note.isTrashed).length}</strong></button>
          <button className={`nav-item ${activeCategory === "Trash" ? "active" : ""}`} type="button" onClick={() => { setActiveCategory("Trash"); setSidebarOpen(false); }}>
            <Trash2 size={18} /><span>Trash</span><strong>{noteList.filter((note) => note.isTrashed).length}</strong></button>
        </nav>
        <div className="category-section"><p className="sidebar-label">Categories</p>{categories.map((category) => {
          const CategoryIcon = category.icon;
          return <button className={`nav-item category-item ${activeCategory === category.name ? "active" : ""}`} type="button" key={category.name} onClick={() => { setActiveCategory(category.name); setSidebarOpen(false); }}><span className={`category-dot dot-${category.theme}`} /><span><CategoryIcon size={15} className="category-icon" />{category.name}</span><strong>{category.count}</strong></button>;
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
          <div className="notes-grid">{filteredNotes.map((note) =>
            <NoteCard note={note} key={note.id} isTrashView={activeCategory === "Trash"} onTrash={moveToTrash} onRestore={restoreNote} onDeletePermanently={deletePermanently} />)}</div>{filteredNotes.length === 0 &&
              <div className="empty-state">
                <Coffee size={22} />
                <p>{activeCategory === "Trash" ? "Trash is empty." : "No notes match your search."}</p></div>}
        </section>
      </main>
    </div>
  );
}

export default NotesPage;
