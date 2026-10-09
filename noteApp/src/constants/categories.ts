import {
  Archive,
  BookOpen,
  Briefcase,
  Heart,
  Lightbulb,
  type LucideIcon,
} from "lucide-react-native";

import type { NoteThemeName } from "./colors";

export type Category = {
  name: string;
  theme: NoteThemeName;
  Icon: LucideIcon;
};

export const categories: Category[] = [
  { name: "Personal", theme: "purple", Icon: Heart },
  { name: "Work", theme: "blue", Icon: Briefcase },
  { name: "Study", theme: "green", Icon: BookOpen },
  { name: "Ideas", theme: "yellow", Icon: Lightbulb },
  { name: "Others", theme: "slate", Icon: Archive },
];

export const categoryNames: string[] = categories.map((category) => category.name);

export const getCategory = (name?: string | null): Category =>
  categories.find((category) => category.name === name) ?? {
    name: name ?? "Others",
    theme: "purple",
    Icon: Archive,
  };
