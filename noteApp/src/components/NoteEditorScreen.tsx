import { useRouter } from "expo-router";
import { Menu, NotebookPen } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NoteForm } from "@/components/NoteForm";
import { NotesScaffold } from "@/components/NotesScaffold";
import { StateMessage } from "@/components/ui/StateMessage";
import { palette } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCurrentNote } from "@/store/slice/noteSlice";
import { createNote, getNoteById, updateNote, type NotePayload } from "@/store/thunk/noteThunk";

interface NoteEditorScreenProps {
  mode: "create" | "edit";
  noteId?: string;
}

export function NoteEditorScreen({ mode, noteId }: NoteEditorScreenProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currentNote, loading: fetching, error } = useAppSelector((state) => state.notes);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEditing = mode === "edit";

  useEffect(() => {
    if (isEditing && noteId) {
      dispatch(getNoteById(noteId));
    }
    return () => {
      dispatch(clearCurrentNote());
    };
  }, [dispatch, isEditing, noteId]);

  const handleSubmit = async (payload: NotePayload) => {
    setSaveError(null);
    setSaving(true);

    try {
      const result =
        isEditing && noteId
          ? await dispatch(updateNote({ id: noteId, noteData: payload })).unwrap()
          : await dispatch(createNote(payload)).unwrap();

      if (result.success) {
        router.replace("/notes");
      }
    } catch (err) {
      setSaveError(typeof err === "string" ? err : "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const showLoading = isEditing && fetching && !currentNote;

  return (
    <NotesScaffold>
      {({ openSidebar }) => (
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={styles.topline}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open navigation"
                  onPress={openSidebar}
                  style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
                  <Menu size={21} color={palette.ink} />
                </Pressable>
                <View style={styles.headingRow}>
                  <NotebookPen size={22} color={palette.purple} />
                  <Text style={styles.heading}>
                    {isEditing ? "Edit Note" : "Create New Note"}
                  </Text>
                </View>
              </View>

              <View style={styles.breadcrumbs}>
                <Text style={styles.crumbLink} onPress={() => router.replace("/notes")}>
                  All Notes
                </Text>
                <Text style={styles.crumbSep}>/</Text>
                <Text style={styles.crumbCurrent}>{isEditing ? "Edit Note" : "New Note"}</Text>
              </View>

              {showLoading ? (
                <StateMessage loading message="Loading note..." />
              ) : (
                <>
                  {error ? <Text style={styles.error}>Error: {error}</Text> : null}
                  <NoteForm
                    key={currentNote?.id ?? "new"}
                    initialNote={isEditing ? currentNote : null}
                    submitLabel={isEditing ? "Save Changes" : "Save Note"}
                    loading={saving}
                    error={saveError}
                    onSubmit={handleSubmit}
                    onCancel={() => router.replace("/notes")}
                  />
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </NotesScaffold>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  topline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 10,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  heading: {
    fontSize: 21,
    fontWeight: "800",
    color: palette.ink,
  },
  breadcrumbs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  crumbLink: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.purple,
  },
  crumbSep: {
    fontSize: 12,
    color: palette.subtle,
  },
  crumbCurrent: {
    fontSize: 12,
    color: palette.muted,
  },
  error: {
    fontSize: 13,
    color: palette.danger,
  },
  pressed: {
    opacity: 0.8,
  },
});
