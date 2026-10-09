import { ConfirmModal } from "./ui/ConfirmModal";

interface LogoutModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ visible, onCancel, onConfirm }: LogoutModalProps) {
  return (
    <ConfirmModal
      visible={visible}
      title="Confirm logout"
      message="Are you sure you want to log out of NoteNest?"
      confirmLabel="Log out"
      cancelLabel="Cancel"
      destructive
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
