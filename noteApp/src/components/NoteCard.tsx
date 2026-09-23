import { MoreHorizontal } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { getCategory } from "@/constants/categories";
import { getNoteTheme, palette } from "@/constants/colors";
import type { Note } from "@/store/types";
import { formatRelativeTime } from "@/utils/date";
import { stripHtml } from "@/utils/text";

import { ConfirmModal } from "./ui/ConfirmModal";

interface NoteCardProps {
  note: Note;
  isTrashView?: boolean;
  onPress: () => void;
  onEdit: () => void;
  onTrash: (id: number) => void;
  onRestore: (id: number) => void;
  onDeletePermanently: (id: number) => void;
}

export function NoteCard({
  note,
  isTrashView = false,
  onPress,
  onEdit,
  onTrash,
  onRestore,
  onDeletePermanently,
}: NoteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const theme = getNoteTheme(note.theme);
  const { Icon } = getCategory(note.category);
  const preview = stripHtml(note.content).slice(0, 200);

  const handleEdit = () => {
    setMenuOpen(false);
    onEdit();
  };

  const handleTrashPress = () => {
    setMenuOpen(false);
    setConfirmingDelete(true);
  };

  const handleRestorePress = () => {
    setMenuOpen(false);
    onRestore(note.id);
  };

  const handleConfirmDelete = () => {
    if (isTrashView) {
      onDeletePermanently(note.id);
    } else {
      onTrash(note.id);
    }
    setConfirmingDelete(false);
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.topline}>
        <View style={[styles.iconBox, { backgroundColor: theme.iconBg }]}>
          <Icon size={22} color={theme.iconColor} strokeWidth={2.25} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${note.title}`}
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            setMenuOpen(true);
          }}
          style={styles.menuButton}>
          <MoreHorizontal size={20} color={palette.muted} />
        </Pressable>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {note.title}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {preview}
      </Text>

      <View style={styles.footer}>
        <View style={[styles.tag, { backgroundColor: theme.tagBg }]}>
          <Text style={[styles.tagText, { color: theme.tagColor }]} numberOfLines={1}>
            {note.category}
          </Text>
        </View>
        <Text style={styles.time}>{formatRelativeTime(note.updatedAt || note.createdAt)}</Text>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
        statusBarTranslucent>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuSheet} onPress={(event) => event.stopPropagation()}>
            {isTrashView ? (
              <>
                <Pressable style={styles.menuItem} onPress={handleRestorePress}>
                  <Text style={styles.menuItemText}>Restore</Text>
                </Pressable>
                <Pressable style={styles.menuItem} onPress={handleTrashPress}>
                  <Text style={[styles.menuItemText, styles.danger]}>Delete</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.menuItem} onPress={handleEdit}>
                  <Text style={styles.menuItemText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.menuItem} onPress={handleTrashPress}>
                  <Text style={[styles.menuItemText, styles.danger]}>Trash</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={confirmingDelete}
        title={isTrashView ? "Delete permanently?" : "Move to trash?"}
        message={
          isTrashView
            ? "This note will be deleted permanently and cannot be recovered."
            : "The note will be moved to trash."
        }
        confirmLabel={isTrashView ? "Delete permanently" : "Move to trash"}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 190,
    padding: 14,
    borderWidth: 1,
    borderRadius: 13,
    justifyContent: "flex-start",
  },
  pressed: {
    opacity: 0.9,
  },
  topline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButton: {
    padding: 4,
  },
  title: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: palette.ink,
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#41506f",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  tag: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: "68%",
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  time: {
    fontSize: 10,
    color: "#384765",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(16,21,44,0.28)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.ink,
  },
  danger: {
    color: "#d93652",
  },
});
