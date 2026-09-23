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
  category: string;
  tags: string;
  theme: string;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  token: string;
}

export interface NotesResponse {
  success: boolean;
  message?: string;
  notes: Note[];
  total: number;
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
