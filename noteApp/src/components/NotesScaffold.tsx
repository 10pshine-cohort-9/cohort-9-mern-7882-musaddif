// TODO(profile-image): profile image upload temporarily disabled. Re-enable by
// uncommenting the import, profileImage state, handlePickImage, and the two
// props passed to NotesSidebar below.
// import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { LogoutModal } from "@/components/LogoutModal";
import { NotesSidebar } from "@/components/NotesSidebar";
import { palette } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slice/authSlice";
import { logoutUser } from "@/store/thunk/authThunk";

interface NotesScaffoldProps {
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  children: (helpers: { openSidebar: () => void }) => ReactNode;
}

export function NotesScaffold({
  activeCategory = "All Notes",
  onSelectCategory,
  children,
}: NotesScaffoldProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const counts = useAppSelector(
    (state) => state.notes.counts
  );
  const user = useAppSelector((state) => state.auth.user);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  // const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleSelectCategory = (category: string) => {
    setSidebarOpen(false);
    if (onSelectCategory) {
      onSelectCategory(category);
    } else {
      router.replace("/notes");
    }
  };

  // const handlePickImage = async () => {
  //   try {
  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ["images"],
  //       allowsEditing: true,
  //       aspect: [1, 1],
  //       quality: 0.7,
  //     });
  //
  //     if (!result.canceled && result.assets[0]?.uri) {
  //       setProfileImage(result.assets[0].uri);
  //     }
  //   } catch {
  //     // Ignore picker failures.
  //   }
  // };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch {
      // Fall through to local logout.
    }
    dispatch(logout());
    setLogoutOpen(false);
    router.replace("/login");
  };

  return (
    <View style={styles.shell}>
      {children({ openSidebar: () => setSidebarOpen(true) })}

      <NotesSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        counts={counts}
        user={user}
        // profileImage={profileImage}
        // onPickImage={handlePickImage}
        onNewNote={() => {
          setSidebarOpen(false);
          router.push("/notes/new");
        }}
        onLogout={() => setLogoutOpen(true)}
      />

      <LogoutModal
        visible={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: palette.backgroundAlt,
  },
});
