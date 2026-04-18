import { CalendarDays, Flame, Trash2 } from "lucide-react";
import { COLOR_CLASS, type Exam } from "@/lib/types";
import { daysBetween, formatLongDate, todayISO } from "@/lib/timetable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExamCard({ exam, onDelete }: { exam: Exam; onDelete: (id: string) => void }) {
  const colors = COLOR_CLASS[exam.color];
  const days = daysBetween(todayISO(), exam.date);
  const isPast = days < 0;
  const label = days === 0 ? "Today!" : days === 1 ? "1 day" : `${Math.abs(days)} days`;

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-gradient-card p-4 shadow-soft ring-1 ring-border/60 transition-pop hover:-translate-y-0.5 hover:shadow-pop">
      <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-xl", colors.bg)} />
      <div className="relative flex items-start gap-3">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-soft", colors.gradient)}>
          <CalendarDays className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold">{exam.subject}</h3>
          <p className="text-xs text-muted-foreground">{formatLongDate(exam.date)}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", isPast ? "bg-muted text-muted-foreground" : colors.soft)}>
              {isPast ? "Done" : `In ${label}`}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <Flame className="h-3 w-3" />
              {"★".repeat(exam.difficulty)}<span className="opacity-30">{"★".repeat(5 - exam.difficulty)}</span>
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(exam.id)} className="h-8 w-8 shrink-0 rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-label={`Delete ${exam.subject}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
