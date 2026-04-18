import { CheckCircle2, Circle, Clock } from "lucide-react";
import { COLOR_CLASS, type Exam, type StudySession } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SessionItem({ session, exam, onToggle }: { session: StudySession; exam: Exam | undefined; onToggle: (id: string) => void }) {
  if (!exam) return null;
  const colors = COLOR_CLASS[exam.color];
  return (
    <button type="button" onClick={() => onToggle(session.id)}
      className={cn("group flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-3 text-left transition-pop hover:-translate-y-0.5 hover:shadow-soft", session.done && "opacity-60")}>
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-soft transition-pop", colors.gradient, session.done && "grayscale")}>
        {session.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <span className={cn("truncate font-semibold block", session.done && "line-through")}>{exam.subject}</span>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /><span>{session.minutes} min</span><span>·</span><span className="truncate">{session.topic}</span>
        </div>
      </div>
    </button>
  );
}
