import { Eye, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { categories } from "@/constants/categories";
import { getNoteTheme, noteColorOptions, palette } from "@/constants/colors";
import { useAppDispatch } from "@/store/hooks";
import { checkGrammar } from "@/store/thunk/aiThunk";
import type { NotePayload } from "@/store/thunk/noteThunk";
import type { Note } from "@/store/types";
import { stripHtml } from "@/utils/text";

import { AppButton } from "./ui/AppButton";
import { AppTextInput } from "./ui/AppTextInput";

interface NoteFormProps {
  initialNote?: Note | null;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (payload: NotePayload) => void;
  onCancel: () => void;
}

export function NoteForm({
  initialNote,
  submitLabel,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [category, setCategory] = useState(initialNote?.category ?? categories[0].name);
  const [tags, setTags] = useState(initialNote?.tags ?? "");
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [theme, setTheme] = useState(initialNote?.theme ?? "purple");

  const [submitted, setSubmitted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const [grammarError, setGrammarError] = useState<string | null>(null);

  const titleMissing = submitted && !title.trim();
  const contentMissing = submitted && !content.trim();

  const handleCheckGrammar = async () => {
    const text = stripHtml(content).trim();
    if (!text) {
      setGrammarError("Write something before checking grammar.");
      return;
    }

    setCheckingGrammar(true);
    setGrammarError(null);

    try {
      const result = await dispatch(checkGrammar(text)).unwrap();
      if (result?.data?.correctedText) {
        setContent(result.data.correctedText);
      }
    } catch (err) {
      setGrammarError(typeof err === "string" ? err : "Failed to check grammar");
    } finally {
      setCheckingGrammar(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (!title.trim() || !content.trim()) return;

    onSubmit({
      title: title.trim(),
      content,
      category,
      tags,
      theme,
    });
  };

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      <AppTextInput
        label="Title"
        required
        value={title}
        onChangeText={setTitle}
        placeholder="Note title"
        error={titleMissing ? "Title is required" : false}
        maxLength={255}
      />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          Category<Text style={styles.required}> *</Text>
        </Text>
        <View style={styles.chipRow}>
          {categories.map((item) => {
            const active = category === item.name;
            const itemTheme = getNoteTheme(item.theme);
            return (
              <Pressable
                key={item.name}
                accessibilityRole="button"
                onPress={() => setCategory(item.name)}
                style={[
                  styles.chip,
                  active && { backgroundColor: itemTheme.iconBg, borderColor: itemTheme.iconBg },
                ]}>
                <item.Icon
                  size={14}
                  color={active ? itemTheme.iconColor : palette.muted}
                  strokeWidth={2.25}
                />
                <Text style={[styles.chipText, active && { color: itemTheme.tagColor }]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <AppTextInput
        label="Tags"
        value={tags}
        onChangeText={setTags}
        placeholder="work, urgent, meeting"
        autoCapitalize="none"
        hint="Separate tags with commas"
      />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          Note<Text style={styles.required}> *</Text>
        </Text>
        <AppTextInput
          value={content}
          onChangeText={setContent}
          placeholder="Start writing here..."
          multiline
          numberOfLines={8}
          error={contentMissing ? "Note content is required" : false}
          inputStyle={styles.contentInput}
          maxLength={10000}
        />

        <View style={styles.grammarRow}>
          <View style={styles.grammarButtons}>
            <AppButton
              title={showPreview ? "Edit" : "Preview"}
              variant="ghost"
              onPress={() => setShowPreview((visible) => !visible)}
              icon={<Eye size={16} color={palette.muted} strokeWidth={1.8} />}
              style={styles.grammarButton}
            />
            <AppButton
              title={checkingGrammar ? "Checking..." : "Check Grammar"}
              variant="secondary"
              loading={checkingGrammar}
              loadingTitle="Checking..."
              disabled={!content.trim()}
              onPress={handleCheckGrammar}
              icon={checkingGrammar ? undefined : <Sparkles size={16} color="#5031ea" />}
              style={styles.grammarButton}
            />
          </View>
          <Text style={styles.counter}>{content.length}/10000</Text>
        </View>
        {grammarError ? <Text style={styles.grammarError}>{grammarError}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Card color</Text>
        <View style={styles.swatchRow}>
          {noteColorOptions.map((color) => {
            const active = theme === color;
            return (
              <Pressable
                key={color}
                accessibilityRole="button"
                accessibilityLabel={`${color} card color`}
                onPress={() => setTheme(color)}
                style={[
                  styles.swatch,
                  { backgroundColor: getNoteTheme(color).swatch },
                  active && styles.swatchActive,
                ]}
              />
            );
          })}
        </View>
      </View>

      {showPreview ? (
        <View
          style={[
            styles.preview,
            {
              backgroundColor: getNoteTheme(theme).card,
              borderColor: getNoteTheme(theme).border,
            },
          ]}>
          <Text style={styles.previewTitle}>{title.trim() || "Untitled note"}</Text>
          <Text style={styles.previewContent}>
            {content.trim() ? stripHtml(content) : "Your note preview will appear here."}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton title="Cancel" variant="ghost" onPress={onCancel} style={styles.actionButton} />
        <AppButton
          title={submitLabel}
          loading={loading}
          onPress={handleSubmit}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  field: {
    gap: 9,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#33405f",
  },
  required: {
    color: "#f02e4c",
  },
  errorBanner: {
    backgroundColor: "#fff4f5",
    borderWidth: 1,
    borderColor: "#f7ccd3",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: "#c52a44",
    fontSize: 13,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.backgroundAlt,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.muted,
  },
  contentInput: {
    minHeight: 180,
  },
  grammarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  grammarButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  grammarButton: {
    flexShrink: 0,
  },
  preview: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.ink,
  },
  previewContent: {
    fontSize: 14,
    lineHeight: 22,
    color: "#31405f",
  },
  counter: {
    fontSize: 11,
    color: palette.subtle,
  },
  grammarError: {
    fontSize: 12,
    color: palette.danger,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: {
    borderColor: palette.primary,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    minWidth: 120,
  },
});
