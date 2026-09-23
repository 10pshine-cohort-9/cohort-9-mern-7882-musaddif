import { useRouter } from "expo-router";
import { Menu, NotebookPen, Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NoteCard } from "@/components/NoteCard";
import { NotesScaffold } from "@/components/NotesScaffold";
import { StateMessage } from "@/components/ui/StateMessage";
import { palette } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteNote, getNotes, restoreNote, trashNote } from "@/store/thunk/noteThunk";
import type { Note } from "@/store/types";
import { stripHtml } from "@/utils/text";

type GridItem = Note | null;

export default function NotesScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { notes, loading, error } = useAppSelector((state) => state.notes);
  const { width } = useWindowDimensions();

  const [activeCategory, setActiveCategory] = useState("All Notes");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(getNotes());
  }, [dispatch]);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return notes.filter((note) => {
      const matchesLocation = activeCategory === "Trash" ? note.isTrashed : !note.isTrashed;
      const matchesCategory =
        activeCategory === "All Notes" ||
        activeCategory === "Trash" ||
        note.category === activeCategory;
      const haystack = `${note.title} ${stripHtml(note.content)} ${note.category}`.toLowerCase();

      return matchesLocation && matchesCategory && (!query || haystack.includes(query));
    });
  }, [activeCategory, notes, searchQuery]);

  const numColumns = width < 520 ? 1 : width < 820 ? 2 : width < 1120 ? 3 : 4;

  const gridData = useMemo<GridItem[]>(() => {
    if (numColumns === 1) return filteredNotes;
    const remainder = filteredNotes.length % numColumns;
    if (remainder === 0) return filteredNotes;
    return [...filteredNotes, ...(Array(numColumns - remainder).fill(null) as null[])];
  }, [filteredNotes, numColumns]);

  const isTrashView = activeCategory === "Trash";

  return (
    <NotesScaffold activeCategory={activeCategory} onSelectCategory={setActiveCategory}>
      {({ openSidebar }) => (
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <FlatList
            key={numColumns}
            data={gridData}
            keyExtractor={(item, index) => (item ? String(item.id) : `spacer-${index}`)}
            numColumns={numColumns}
            columnWrapperStyle={numColumns > 1 ? styles.column : undefined}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={styles.header}>
                <View style={styles.topline}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open navigation"
                    onPress={openSidebar}
                    style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
                    <Menu size={21} color={palette.ink} />
                  </Pressable>

                  <View style={styles.searchWrap}>
                    <Search size={18} color={palette.placeholder} strokeWidth={1.9} />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search your notes..."
                      placeholderTextColor={palette.placeholder}
                      style={styles.searchInput}
                      returnKeyType="search"
                    />
                  </View>
                </View>

                <View style={styles.pageHeading}>
                  <Text style={styles.pageTitle}>{activeCategory}</Text>
                  <Text style={styles.pageCount}>
                    {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
                  </Text>
                </View>

                {loading ? <StateMessage loading message="Loading notes..." /> : null}
                {error ? <StateMessage message={`Error: ${error}`} tone="error" /> : null}
              </View>
            }
            ListEmptyComponent={
              loading || error ? null : (
                <View style={styles.emptyState}>
                  <NotebookPen size={22} color={palette.subtle} />
                  <Text style={styles.emptyText}>
                    {isTrashView ? "Trash is empty." : "No notes match your search."}
                  </Text>
                </View>
              )
            }
            renderItem={({ item }) => {
              if (!item) return <View style={styles.spacer} />;

              return (
                <NoteCard
                  note={item}
                  isTrashView={isTrashView}
                  onPress={() => router.push(`/notes/${item.id}`)}
                  onEdit={() => router.push(`/notes/${item.id}/edit`)}
                  onTrash={(id) => dispatch(trashNote(id))}
                  onRestore={(id) => dispatch(restoreNote(id))}
                  onDeletePermanently={(id) => dispatch(deleteNote(id))}
                />
              );
            }}
          />
        </SafeAreaView>
      )}
    </NotesScaffold>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  header: {
    gap: 12,
  },
  topline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: palette.ink,
    paddingVertical: 0,
  },
  pageHeading: {
    marginTop: 6,
    gap: 3,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: palette.ink,
  },
  pageCount: {
    fontSize: 13,
    color: palette.muted,
  },
  column: {
    gap: 12,
  },
  spacer: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 13,
    color: palette.muted,
  },
  pressed: {
    opacity: 0.8,
  },
});
