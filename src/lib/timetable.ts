import type { Exam, Preferences, StudySession } from "./types";

export function todayISO(): string {
  const d = new Date(); d.setHours(0, 0, 0, 0); return toISO(d);
}
export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000);
}
export function formatLongDate(s: string): string {
  return fromISO(s).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
export function formatDayHeader(s: string): string {
  const diff = daysBetween(todayISO(), s);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff < 7) return fromISO(s).toLocaleDateString(undefined, { weekday: "long" });
  return formatLongDate(s);
}

export function generateTimetable(exams: Exam[], prefs: Preferences, existing: StudySession[] = []): StudySession[] {
  const start = todayISO();
  const startDate = fromISO(start);
  startDate.setDate(startDate.getDate() + Math.max(0, prefs.startBufferDays));

  const upcoming = exams.filter(e => daysBetween(start, e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  if (upcoming.length === 0) return [];

  const farthest = upcoming[upcoming.length - 1].date;
  const totalDays = Math.max(1, daysBetween(toISO(startDate), farthest));
  const doneMap = new Map<string, boolean>();
  for (const s of existing) doneMap.set(`${s.date}|${s.examId}|${s.topic}`, s.done);

  const sessions: StudySession[] = [];
  const dayMinutesCap = Math.round(prefs.hoursPerDay * 60);
  const block = Math.max(15, prefs.sessionLength);

  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(startDate); d.setDate(d.getDate() + i);
    const iso = toISO(d);
    if (!prefs.studyDays.includes(d.getDay())) continue;

    const eligible = upcoming.filter(e => daysBetween(iso, e.date) >= 1);
    if (eligible.length === 0) continue;

    const weights = eligible.map(e => e.difficulty / Math.sqrt(Math.max(1, daysBetween(iso, e.date))));
    const totalW = weights.reduce((a, b) => a + b, 0);
    const totalBlocks = Math.max(1, Math.floor(dayMinutesCap / block));
    const blocksPerExam: number[] = eligible.map((_, idx) => Math.round((weights[idx] / totalW) * totalBlocks));
    if (blocksPerExam.every(b => b === 0)) {
      const maxIdx = weights.indexOf(Math.max(...weights));
      (blocksPerExam as number[])[maxIdx] = 1;
    }

    eligible.forEach((exam, idx) => {
      for (let b = 0; b < blocksPerExam[idx]; b++) {
        const topic = `Study block ${b + 1}`;
        sessions.push({
          id: `${iso}-${exam.id}-${b}`,
          examId: exam.id, date: iso, minutes: block, topic,
          done: doneMap.get(`${iso}|${exam.id}|${topic}`) ?? false,
        });
      }
    });
  }
  return sessions;
}

export function groupByDate<T extends { date: string }>(items: T[]): { date: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const it of items) { if (!map.has(it.date)) map.set(it.date, []); map.get(it.date)!.push(it); }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => ({ date, items }));
}
