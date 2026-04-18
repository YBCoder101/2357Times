import { useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import { ExamCard } from "@/components/ExamCard";
import { SessionItem } from "@/components/SessionItem";
import { AddExamDialog } from "@/components/AddExamDialog";
import { PreferencesPanel } from "@/components/PreferencesPanel";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { generateTimetable, groupByDate, todayISO, formatDayHeader } from "@/lib/timetable";
import { DEFAULT_PREFS, type Exam, type Preferences, type StudySession } from "@/lib/types";
import { CheckCircle2, ClipboardList, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export default function Index() {
  const [exams, setExams] = useLocalStorage<Exam[]>("study-exams", []);
  const [prefs, setPrefs] = useLocalStorage<Preferences>("study-prefs", DEFAULT_PREFS);
  const [sessions, setSessions] = useLocalStorage<StudySession[]>("study-sessions", []);

  // Regenerate timetable when exams or prefs change
  const freshSessions = useMemo(
    () => generateTimetable(exams, prefs, sessions),
    [exams, prefs, sessions]
  );

  // Keep sessions in sync with generated timetable (preserve done status)
  useEffect(() => {
    const existingMap = new Map(sessions.map((s) => [s.id, s.done]));
    const merged = freshSessions.map((s) => ({
      ...s,
      done: existingMap.get(s.id) ?? s.done,
    }));
    setSessions(merged);
  }, [freshSessions, setSessions]);

  const grouped = groupByDate(sessions);
  const today = todayISO();
  const completedCount = sessions.filter((s) => s.done).length;
  const totalCount = sessions.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  const handleToggleSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const handleAddExam = (exam: Omit<Exam, "id">) => {
    const newExam: Exam = { ...exam, id: crypto.randomUUID() };
    setExams((prev) => [...prev, newExam]);
  };

  const handleDeleteExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    // Remove orphaned sessions
    setSessions((prev) => prev.filter((s) => s.examId !== id));
  };

  const handleSavePrefs = (newPrefs: Preferences) => {
    setPrefs(newPrefs);
  };

  const examMap = useMemo(() => {
    const map = new Map<string, Exam>();
    exams.forEach((e) => map.set(e.id, e));
    return map;
  }, [exams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pb-24">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              StudyPop
            </h1>
          </div>
          <PreferencesPanel prefs={prefs} onSave={handleSavePrefs} />
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-5 space-y-6">
        {/* Progress card */}
        <div className="rounded-3xl bg-gradient-card p-5 shadow-soft ring-1 ring-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              <span>Study Progress</span>
            </div>
            <span className="text-xs font-medium">
              {completedCount} / {totalCount} done
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>📚 {exams.length} exams</span>
            <span>⏱️ {prefs.hoursPerDay}h/day target</span>
          </div>
        </div>

        {/* Add exam button */}
        <div className="flex justify-center">
          <AddExamDialog onAdd={handleAddExam} />
        </div>

        {/* Exams list */}
        {exams.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>📋 Your Exams</span>
            </h2>
            <div className="space-y-3">
              {exams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} onDelete={handleDeleteExam} />
              ))}
            </div>
          </section>
        )}

        {/* Study timetable */}
        {sessions.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Your Study Plan</span>
            </h2>
            <div className="space-y-5">
              {grouped.map(({ date, items }) => {
                const isToday = date === today;
                return (
                  <div key={date}>
                    <div
                      className={cn(
                        "sticky top-[73px] z-5 mb-2 text-sm font-medium",
                        isToday
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatDayHeader(date)}
                    </div>
                    <div className="space-y-2">
                      {items.map((session) => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          exam={examMap.get(session.examId)}
                          onToggle={handleToggleSession}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : exams.length > 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No study sessions generated yet.</p>
            <p className="text-sm">Check your preferences or add exams with future dates.</p>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="mx-auto h-12 w-12 opacity-30 mb-3" />
            <p>No exams added yet.</p>
            <p className="text-sm">Tap "Add Exam" to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
}