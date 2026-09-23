import {
  ChevronDown,
  House,
  LogOut,
  NotebookPen,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react-native";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { categories } from "@/constants/categories";
import { getNoteTheme, palette } from "@/constants/colors";
import type { Note, User } from "@/store/types";

interface NotesSidebarProps {
  visible: boolean;
  onClose: () => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  notes: Note[];
  user: User | null;
  profileImage: string | null;
  onPickImage: () => void;
  onNewNote: () => void;
  onLogout: () => void;
}

export function NotesSidebar({
  visible,
  onClose,
  activeCategory,
  onSelectCategory,
  notes,
  user,
  profileImage,
  onPickImage,
  onNewNote,
  onLogout,
}: NotesSidebarProps) {
  const activeNotes = notes.filter((note) => !note.isTrashed);
  const trashedNotes = notes.filter((note) => note.isTrashed);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close navigation" />
        <SafeAreaView style={styles.drawer} edges={["top", "bottom", "left"]}>
          <View style={styles.brand}>
            <NotebookPen size={22} color={palette.purple} />
            <Text style={styles.brandText}>NoteNest</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close navigation"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeButton}>
              <X size={18} color={palette.muted} />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onNewNote}
            style={({ pressed }) => [styles.newNoteButton, pressed && styles.pressed]}>
            <Plus size={20} color={palette.white} />
            <Text style={styles.newNoteText}>New Note</Text>
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            <View style={styles.navGroup}>
              <NavItem
                label="All Notes"
                count={activeNotes.length}
                active={activeCategory === "All Notes"}
                icon={<House size={18} color={activeCategory === "All Notes" ? palette.purple : "#28314b"} />}
                onPress={() => onSelectCategory("All Notes")}
              />
              <NavItem
                label="Trash"
                count={trashedNotes.length}
                active={activeCategory === "Trash"}
                icon={<Trash2 size={18} color={activeCategory === "Trash" ? palette.purple : "#28314b"} />}
                onPress={() => onSelectCategory("Trash")}
              />
            </View>

            <Text style={styles.sectionLabel}>Categories</Text>
            <View style={styles.navGroup}>
              {categories.map((category) => {
                const count = activeNotes.filter((note) => note.category === category.name).length;
                const active = activeCategory === category.name;
                return (
                  <NavItem
                    key={category.name}
                    label={category.name}
                    count={count}
                    active={active}
                    dotColor={getNoteTheme(category.theme).dot}
                    onPress={() => onSelectCategory(category.name)}
                  />
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.profileArea}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile image"
              onPress={onPickImage}
              style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
              <View style={styles.avatar}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <UserRound size={22} color="#61708a" />
                )}
              </View>
              <View style={styles.profileCopy}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.name || "User"}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user?.email || "user@example.com"}
                </Text>
              </View>
              <ChevronDown size={17} color={palette.muted} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onLogout}
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}>
              <LogOut size={16} color="#e0576c" />
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

interface NavItemProps {
  label: string;
  count: number;
  active: boolean;
  icon?: React.ReactNode;
  dotColor?: string;
  onPress: () => void;
}

function NavItem({ label, count, active, icon, dotColor, onPress }: NavItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        active && styles.navItemActive,
        pressed && !active && styles.navItemPressed,
      ]}>
      {dotColor ? <View style={[styles.categoryDot, { backgroundColor: dotColor }]} /> : icon}
      <Text style={[styles.navLabel, active && styles.navLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.navCount, active && styles.navCountActive]}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(18,24,47,0.25)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 288,
    maxWidth: "85%",
    backgroundColor: palette.white,
    borderRightWidth: 1,
    borderRightColor: palette.line,
    paddingHorizontal: 20,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingTop: 14,
    paddingBottom: 26,
  },
  brandText: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: "#4322ed",
  },
  closeButton: {
    padding: 6,
  },
  newNoteButton: {
    height: 44,
    borderRadius: 9,
    backgroundColor: palette.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginBottom: 22,
  },
  newNoteText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "700",
  },
  scrollBody: {
    paddingBottom: 16,
  },
  navGroup: {
    gap: 4,
  },
  sectionLabel: {
    marginTop: 26,
    marginBottom: 12,
    marginLeft: 4,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#66708d",
  },
  navItem: {
    minHeight: 42,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navItemActive: {
    backgroundColor: palette.activeBg,
  },
  navItemPressed: {
    backgroundColor: "#f7f7fc",
  },
  navLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#28314b",
  },
  navLabelActive: {
    color: palette.purple,
    fontWeight: "700",
  },
  navCount: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.muted,
  },
  navCountActive: {
    color: palette.purple,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 1,
  },
  profileArea: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#edf0f7",
    paddingTop: 18,
    paddingBottom: 8,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.avatarBg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  profileName: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.ink,
  },
  profileEmail: {
    fontSize: 10,
    color: "#66718d",
  },
  logoutButton: {
    marginTop: 14,
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  logoutPressed: {
    backgroundColor: "#fff6f7",
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d93652",
  },
  pressed: {
    opacity: 0.85,
  },
});
