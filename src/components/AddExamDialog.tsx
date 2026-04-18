import { useState } from "react";
import { CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXAM_COLORS, type Exam, type ExamColor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AddExamDialogProps {
  onAdd: (exam: Omit<Exam, "id">) => void;
}

export function AddExamDialog({ onAdd }: AddExamDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [color, setColor] = useState<ExamColor>("primary");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !date) return;
    onAdd({
      subject: subject.trim(),
      date: format(date, "yyyy-MM-dd"),
      difficulty,
      color,
      notes: notes.trim() || undefined,
    });
    setOpen(false);
    setSubject("");
    setDate(undefined);
    setDifficulty(3);
    setColor("primary");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-soft">
          <Plus className="mr-2 h-4 w-4" /> Add Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add New Exam</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="e.g., Mathematics 101"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Exam Date *</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              fromDate={new Date()}
              className="rounded-2xl border shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty (1-5)</Label>
            <Select
              value={difficulty.toString()}
              onValueChange={(v) => setDifficulty(Number(v) as 1 | 2 | 3 | 4 | 5)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((d) => (
                  <SelectItem key={d} value={d.toString()}>
                    {"★".repeat(d)}{"★".repeat(5 - d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color Theme</Label>
            <div className="flex flex-wrap gap-2">
              {EXAM_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    color === c && "ring-2 ring-offset-2 ring-foreground"
                  )}
                  style={{
                    backgroundColor: `hsl(var(--${c === "primary" ? "primary" : c === "secondary" ? "secondary" : c === "accent" ? "accent" : c === "highlight" ? "highlight" : c === "sunshine" ? "sunshine" : "destructive"}))`,
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any extra info..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Exam</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}