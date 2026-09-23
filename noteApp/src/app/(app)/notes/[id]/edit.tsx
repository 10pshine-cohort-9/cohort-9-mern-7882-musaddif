import { useLocalSearchParams } from "expo-router";

import { NoteEditorScreen } from "@/components/NoteEditorScreen";

export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <NoteEditorScreen mode="edit" noteId={id} />;
}
