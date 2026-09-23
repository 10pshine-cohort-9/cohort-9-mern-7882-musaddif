/**
 * NoteNest color palette ported from the web application CSS.
 */
export const palette = {
  ink: "#10152c",
  muted: "#64708e",
  subtle: "#7a86a4",
  line: "#e9ebf5",
  purple: "#4d27ef",
  primary: "#5931f5",
  primaryDark: "#4920e8",
  primarySoft: "#f0edff",
  primaryTint: "#eee9ff",
  activeBg: "#f1efff",
  background: "#ffffff",
  backgroundAlt: "#fafbff",
  sidebar: "#fbfbff",
  inputBg: "#f8f8fc",
  inputBorder: "#e4e5f0",
  placeholder: "#7b86a6",
  danger: "#d3314a",
  dangerBg: "#ffe4e6",
  dangerBorder: "#fecdd3",
  success: "#0f7a5a",
  successBg: "#e4f7ef",
  avatarBg: "#dfe6f0",
  overlay: "rgba(16,21,44,0.32)",
  white: "#ffffff",
} as const;

export type NoteThemeName = "purple" | "blue" | "green" | "yellow" | "orange" | "red" | "slate";

export type NoteTheme = {
  card: string;
  border: string;
  iconBg: string;
  iconColor: string;
  tagBg: string;
  tagColor: string;
  dot: string;
  swatch: string;
};

export const noteThemes: Record<NoteThemeName, NoteTheme> = {
  purple: {
    card: "#fbf9ff",
    border: "#e8e1ff",
    iconBg: "#eee9ff",
    iconColor: "#5d35ee",
    tagBg: "#ede7ff",
    tagColor: "#5b35d9",
    dot: "#7658f7",
    swatch: "#5931f5",
  },
  blue: {
    card: "#f6faff",
    border: "#dbe9fa",
    iconBg: "#dcecff",
    iconColor: "#1674e8",
    tagBg: "#dfeeff",
    tagColor: "#1d70d2",
    dot: "#1681f5",
    swatch: "#66b6f2",
  },
  green: {
    card: "#f6fffa",
    border: "#d9f1e3",
    iconBg: "#d8f7e4",
    iconColor: "#00a94f",
    tagBg: "#d9f6e4",
    tagColor: "#16834a",
    dot: "#15be64",
    swatch: "#65d69a",
  },
  yellow: {
    card: "#fffdf6",
    border: "#f8ecd1",
    iconBg: "#fff2d2",
    iconColor: "#ed9700",
    tagBg: "#fff0c9",
    tagColor: "#ba7200",
    dot: "#ffbe0b",
    swatch: "#ffca4b",
  },
  orange: {
    card: "#fffdf6",
    border: "#f8ecd1",
    iconBg: "#fff2d2",
    iconColor: "#ed9700",
    tagBg: "#fff0c9",
    tagColor: "#ba7200",
    dot: "#ffbe0b",
    swatch: "#ffca4b",
  },
  red: {
    card: "#fff9fa",
    border: "#f9e0e4",
    iconBg: "#ffe0e5",
    iconColor: "#f02942",
    tagBg: "#ffe0e6",
    tagColor: "#e72e4a",
    dot: "#f37696",
    swatch: "#f37696",
  },
  slate: {
    card: "#fbfbff",
    border: "#e7e8f4",
    iconBg: "#e9ebf5",
    iconColor: "#69748e",
    tagBg: "#e9eaf5",
    tagColor: "#64708d",
    dot: "#a1abc2",
    swatch: "#b8c0d2",
  },
};

export const noteColorOptions: NoteThemeName[] = [
  "purple",
  "blue",
  "green",
  "yellow",
  "red",
  "slate",
];

export const getNoteTheme = (name?: string | null): NoteTheme =>
  (name && (noteThemes as Record<string, NoteTheme>)[name]) || noteThemes.purple;
