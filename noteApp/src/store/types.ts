export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  created_at?: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  /** Plain-text excerpt returned by GET /notes (full content omitted in list responses). */
  contentPreview?: string;
  category: string;
  tags: string;
  theme: string;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotesPagination {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface NotesCounts {
  total: number;
  active: number;
  trashed: number;
  byCategory: Record<string, number>;
}

export interface GetNotesParams {
  scope?: "active" | "trash" | "all";
  category?: string;
  q?: string;
  limit?: number;
  cursor?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  token: string;
  refreshToken?: string;
}

export interface RefreshResponse {
  success: boolean;
  message?: string;
  user: User;
  token: string;
  refreshToken: string;
}

export interface NotesResponse {
  success: boolean;
  message?: string;
  notes: Note[];
  total?: number;
  pagination?: NotesPagination;
  counts?: NotesCounts;
}

export interface NoteResponse {
  success: boolean;
  message?: string;
  note: Note;
}

export interface MessageResponse {
  success: boolean;
  message?: string;
}

export interface GrammarResponse {
  success: boolean;
  data: {
    originalText: string;
    correctedText: string;
  };
}
