import { LogOut, X } from "lucide-react";

function LogoutModal({ onCancel, onConfirm }) {
  return (
    <div className="logout-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title" onClick={(event) => event.stopPropagation()}>
        <button className="logout-modal-close icon-button" type="button" onClick={onCancel} aria-label="Close confirmation"><X size={18} /></button>
        <div className="logout-modal-icon"><LogOut size={21} /></div>
        <h2 id="logout-title">Confirm logout</h2>
        <p>Are you sure you want to log out of NoteNest?</p>
        <div className="logout-modal-actions"><button className="logout-cancel" type="button" onClick={onCancel}>Cancel</button><button className="logout-confirm" type="button" onClick={onConfirm}><LogOut size={15} /> Log out</button></div>
      </div>
    </div>
  );
}

export default LogoutModal;
