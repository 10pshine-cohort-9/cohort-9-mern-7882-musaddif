import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CalendarDays, Clock3, Edit3, Tag } from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { StateMessage } from "@/components/ui/StateMessage";
import { getCategory } from "@/constants/categories";
import { getNoteTheme, palette } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCurrentNote } from "@/store/slice/noteSlice";
import { getNoteById } from "@/store/thunk/noteThunk";
import { formatDateTime } from "@/utils/date";
import { stripHtml } from "@/utils/text";

export default function NoteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currentNote, loading, error } = useAppSelector((state) => state.notes);

  useEffect(() => {
    if (id) {
      dispatch(getNoteById(id));
    }
    return () => {
      dispatch(clearCurrentNote());
    };
  }, [id, dispatch]);

  if (loading && !currentNote) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StateMessage loading message="Loading note..." />
      </SafeAreaView>
    );
  }

  if (error || !currentNote) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]} edges={["top"]}>
        <StateMessage
          message={error ? `Error: ${error}` : "Note not found."}
          tone={error ? "error" : "default"}
        />
        <AppButton title="Back to All Notes" onPress={() => router.replace("/notes")} />
      </SafeAreaView>
    );
  }

  const note = currentNote;
  const theme = getNoteTheme(note.theme);
  const { Icon } = getCategory(note.category);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topbar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/notes")}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <ArrowLeft size={17} color={palette.ink} strokeWidth={2} />
          <Text style={styles.backText}>Back to All Notes</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/notes/${note.id}/edit`)}
          style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
          <Edit3 size={16} color={palette.white} strokeWidth={2} />
          <Text style={styles.editText}>Edit Note</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.paper, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.iconBg }]}>
            <Icon size={26} color={theme.iconColor} strokeWidth={2.2} />
          </View>

          <View style={[styles.tag, { backgroundColor: theme.tagBg }]}>
            <Text style={[styles.tagText, { color: theme.tagColor }]}>{note.category}</Text>
          </View>

          <Text style={styles.title}>{note.title}</Text>

          <View style={styles.meta}>
            <MetaRow
              icon={<CalendarDays size={15} color={palette.muted} />}
              text={`Created: ${formatDateTime(note.createdAt)}`}
            />
            <MetaRow
              icon={<Clock3 size={15} color={palette.muted} />}
              text={`Updated: ${formatDateTime(note.updatedAt)}`}
            />
            {note.tags ? (
              <MetaRow icon={<Tag size={15} color={palette.muted} />} text={note.tags} />
            ) : null}
          </View>

          <Text style={styles.content}>{stripHtml(note.content) || "No content."}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <View style={styles.metaRow}>
      {icon}
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.backgroundAlt,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  backText: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.ink,
  },
  edit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 9,
    backgroundColor: palette.primary,
  },
  editText: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.white,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  paper: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    alignSelf: "flex-start",
    marginTop: 16,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: "800",
    color: palette.ink,
  },
  meta: {
    marginTop: 14,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: palette.muted,
    flexShrink: 1,
  },
  content: {
    marginTop: 20,
    fontSize: 15,
    lineHeight: 24,
    color: "#2c3a55",
  },
  pressed: {
    opacity: 0.8,
  },
});
