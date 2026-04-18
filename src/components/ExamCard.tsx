import { CalendarDays, Flame, Trash2 } from "lucide-react";
import { COLOR_CLASS, type Exam } from "@/lib/types";
import { daysBetween, formatLongDate, todayISO } from "@/lib/timetable";
import { cn } from "@/lib/utils";

export function ExamCard({ exam, onDelete }: { exam: Exam; onDelete: (id: string) => void }) {
  const colors = COLOR_CLASS[exam.color];
  const days = daysBetween(todayISO(), exam.date);
  const isPast = days < 0;
  const label = days === 0 ? "Today!" : days === 1 ? "1 day" : `${Math.abs(days)} days`;

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 p-4 shadow-soft ring-1 ring-gray-200 dark:ring-gray-800 transition-pop hover:-translate-y-0.5 hover:shadow-pop">
      <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-xl", colors.bg)} />
      <div className="relative flex items-start gap-3">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-soft", colors.gradient)}>
          <CalendarDays className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold">{exam.subject}</h3>
          <p className="text-xs text-gray-500">{formatLongDate(exam.date)}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", isPast ? "bg-gray-100 text-gray-500" : `${colors.bg}/10 ${colors.text}`)}>
              {isPast ? "Done" : `In ${label}`}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              <Flame className="h-3 w-3" />
              {"★".repeat(exam.difficulty)}<span className="opacity-30">{"★".repeat(5-exam.difficulty)}</span>
            </span>
          </div>
        </div>
        {/* Use a regular button, not shadcn Button */}
        <button
          onClick={() => onDelete(exam.id)}
          className="h-8 w-8 shrink-0 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
          aria-label={`Delete ${exam.subject}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}