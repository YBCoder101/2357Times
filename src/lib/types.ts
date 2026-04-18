export type ExamColor = "primary" | "secondary" | "accent" | "highlight" | "sunshine" | "rose";

export interface Exam {
  id: string;
  subject: string;
  date: string; // ISO yyyy-mm-dd
  difficulty: 1 | 2 | 3 | 4 | 5;
  color: ExamColor;
  notes?: string;
}

export interface StudySession {
  id: string;
  examId: string;
  date: string;
  minutes: number;
  topic: string;
  done: boolean;
}

export interface Preferences {
  hoursPerDay: number;
  sessionLength: number;
  studyDays: number[]; // 0 (Sun) - 6 (Sat)
  startBufferDays: number;
}

export const DEFAULT_PREFS: Preferences = {
  hoursPerDay: 2,
  sessionLength: 45,
  studyDays: [0, 1, 2, 3, 4, 5, 6],
  startBufferDays: 0,
};

export const EXAM_COLORS: ExamColor[] = ["primary", "secondary", "accent", "highlight", "sunshine", "rose"];

export const COLOR_CLASS: Record<ExamColor, { bg: string; text: string; ring: string; soft: string; gradient: string }> = {
  primary:   { bg: "bg-primary",     text: "text-primary",     ring: "ring-primary/40",     soft: "bg-primary/10 text-primary",     gradient: "bg-gradient-primary" },
  secondary: { bg: "bg-secondary",   text: "text-secondary",   ring: "ring-secondary/40",   soft: "bg-secondary/10 text-secondary", gradient: "bg-gradient-sunset"  },
  accent:    { bg: "bg-accent",      text: "text-accent",      ring: "ring-accent/40",      soft: "bg-accent/10 text-accent",       gradient: "bg-gradient-meadow"  },
  highlight: { bg: "bg-highlight",   text: "text-highlight",   ring: "ring-highlight/40",   soft: "bg-highlight/10 text-highlight", gradient: "bg-gradient-ocean"   },
  sunshine:  { bg: "bg-sunshine",    text: "text-sunshine-foreground", ring: "ring-sunshine/40", soft: "bg-sunshine/20 text-sunshine-foreground", gradient: "bg-gradient-meadow" },
  rose:      { bg: "bg-destructive", text: "text-destructive", ring: "ring-destructive/40", soft: "bg-destructive/10 text-destructive", gradient: "bg-gradient-sunset" },
};
