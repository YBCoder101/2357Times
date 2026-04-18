import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { ExamCard } from "@/components/ExamCard";
import { SessionItem } from "@/components/SessionItem";
import { AddExamDialog } from "@/components/AddExamDialog";
import { PreferencesPanel } from "@/components/PreferencesPanel";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { generateTimetable, groupByDate, todayISO, formatDayHeader } from "@/lib/timetable";
import { DEFAULT_PREFS, type Exam, type Preferences, type StudySession } from "@/lib/types";
import { CheckCircle2, ClipboardList, GraduationCap } from "lucide-react";

export default function Index() {
  const [exams, setExams] = useLocalStorage<Exam[]>("study-exams", []);
  const [prefs, setPrefs] = useLocalStorage<Preferences>("study-prefs", DEFAULT_PREFS);
  const [sessions, setSessions] = useLocalStorage<StudySession[]>("study-sessions", []);

  const freshSessions = useMemo(() => generateTimetable(exams, prefs, sessions), [exams, prefs, sessions]);

  useEffect(() => {
    const existingMap = new Map(sessions.map(s => [s.id, s.done]));
    const merged = freshSessions.map(s => ({ ...s, done: existingMap.get(s.id) ?? s.done }));
    setSessions(merged);
  }, [freshSessions, setSessions]);

  const grouped = groupByDate(sessions);
  const today = todayISO();
  const completedCount = sessions.filter(s => s.done).length;
  const totalCount = sessions.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  const handleToggleSession = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s));
    toast.success("Progress updated");
  };
  const handleAddExam = (exam: Omit<Exam, "id">) => {
    const newExam: Exam = { ...exam, id: crypto.randomUUID() };
    setExams(prev => [...prev, newExam]);
    toast.success("Exam added!");
  };
  const handleDeleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
    setSessions(prev => prev.filter(s => s.examId !== id));
    toast.info("Exam removed");
  };
  const handleSavePrefs = (newPrefs: Preferences) => setPrefs(newPrefs);

  const examMap = useMemo(() => new Map(exams.map(e => [e.id, e])), [exams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-24">
      <Toaster position="top-center" richColors />
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2"><GraduationCap className="h-6 w-6 text-purple-600"/><h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">StudyPop</h1></div>
          <PreferencesPanel prefs={prefs} onSave={handleSavePrefs} />
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-5 space-y-6">
        {/* Progress card - no shadcn Progress component */}
        <div className="rounded-3xl bg-white dark:bg-gray-900 p-5 shadow-soft ring-1 ring-gray-200 dark:ring-gray-800">
          <div className="flex justify-between mb-2">
            <div className="flex gap-2 text-sm font-medium text-gray-500">
              <ClipboardList className="h-4 w-4"/>Study Progress
            </div>
            <span className="text-xs">{completedCount}/{totalCount} done</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full transition-all" style={{width:`${progress}%`}}/>
          </div>
          <div className="mt-4 flex justify-between text-xs text-gray-500">
            <span>📚 {exams.length} exams</span>
            <span>⏱️ {prefs.hoursPerDay}h/day target</span>
          </div>
        </div>

        <div className="flex justify-center"><AddExamDialog onAdd={handleAddExam} /></div>

        {exams.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">📋 Your Exams</h2>
            <div className="space-y-3">
              {exams.map(exam => <ExamCard key={exam.id} exam={exam} onDelete={handleDeleteExam}/>)}
            </div>
          </section>
        )}

        {sessions.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold mb-3 flex gap-2"><CheckCircle2 className="h-5 w-5 text-purple-600"/>Your Study Plan</h2>
            <div className="space-y-5">
              {grouped.map(({date,items}) => (
                <div key={date}>
                  <div className={`sticky top-[73px] mb-2 text-sm font-medium ${date===today ? "text-purple-600" : "text-gray-500"}`}>
                    {formatDayHeader(date)}
                  </div>
                  <div className="space-y-2">
                    {items.map(session => <SessionItem key={session.id} session={session} exam={examMap.get(session.examId)} onToggle={handleToggleSession}/>)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : exams.length > 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No study sessions generated yet.</p>
            <p className="text-sm">Check your preferences or add exams with future dates.</p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <GraduationCap className="mx-auto h-12 w-12 opacity-30 mb-3"/>
            <p>No exams added yet.</p>
            <p className="text-sm">Tap "Add Exam" to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
}