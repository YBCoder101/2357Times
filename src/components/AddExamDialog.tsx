import { useState } from "react";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { EXAM_COLORS, type Exam, type ExamColor } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

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

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const handleDateSelect = (day: number) => {
    setDate(new Date(viewYear, viewMonth, day));
    setShowDatePicker(false);
  };

  const renderCalendar = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const days = daysInMonth(viewYear, viewMonth);
    const blanks = Array(firstDay).fill(null);
    const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);
    const allCells = [...blanks, ...dayNumbers];
    const rows = [];
    for (let i = 0; i < allCells.length; i += 7) rows.push(allCells.slice(i, i + 7));
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border p-4 absolute top-full left-0 mt-2 z-50 w-64">
        <div className="flex justify-between items-center mb-3">
          <button type="button" onClick={() => setViewMonth(prev => prev - 1)} className="p-1 hover:bg-gray-100 rounded">←</button>
          <span>{new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long' })} {viewYear}</span>
          <button type="button" onClick={() => setViewMonth(prev => prev + 1)} className="p-1 hover:bg-gray-100 rounded">→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-1">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d}>{d}</div>)}
        </div>
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-7 gap-1">
            {row.map((cell, i) => (
              <button key={i} type="button" onClick={() => typeof cell === 'number' && handleDateSelect(cell)} className={cn("h-8 w-8 rounded-full text-sm", typeof cell === 'number' ? "hover:bg-purple-100" : "invisible", date && cell === date.getDate() && viewMonth === date.getMonth() && viewYear === date.getFullYear() && "bg-purple-500 text-white")}>
                {cell}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Fixed: explicit typing with 'as const' to ensure keys match ExamColor
  const colorStyle: { [key in ExamColor]: string } = {
    primary: "#8B5CF6",
    secondary: "#EC4899",
    accent: "#10B981",
    highlight: "#06B6D4",
    sunshine: "#FBBF24",
    rose: "#F43F5E", // rose red color
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-full shadow-soft bg-purple-600 text-white px-5 py-2.5 font-medium flex items-center gap-2 hover:bg-purple-700 transition-all">
        <Plus className="h-4 w-4" /> Add Exam
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-pop">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-semibold">Add New Exam</h2>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="text-sm font-medium">Subject *</label><input type="text" placeholder="e.g., Mathematics 101" value={subject} onChange={e=>setSubject(e.target.value)} required className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
              <div className="relative"><label className="text-sm font-medium">Exam Date *</label><button type="button" onClick={()=>setShowDatePicker(!showDatePicker)} className="w-full flex justify-between items-center rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2"><span>{date ? format(date,"PPP") : "Select date"}</span><CalendarIcon className="h-4 w-4 text-gray-400"/></button>{showDatePicker && renderCalendar()}</div>
              <div><label className="text-sm font-medium">Difficulty (1-5)</label><div className="flex gap-2">{([1,2,3,4,5] as const).map(d=>(<button key={d} type="button" onClick={()=>setDifficulty(d)} className={cn("flex-1 py-2 rounded-xl font-medium transition-all", difficulty===d ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700")}>{"★".repeat(d)}{"★".repeat(5-d)}</button>))}</div></div>
              <div><label className="text-sm font-medium">Color Theme</label><div className="flex flex-wrap gap-2">{EXAM_COLORS.map(c=>(
                <button key={c} type="button" className={cn("h-8 w-8 rounded-full transition-all", color===c && "ring-2 ring-offset-2 ring-gray-400")} style={{ backgroundColor: colorStyle[c] }} onClick={()=>setColor(c)}/>
              ))}</div></div>
              <div><label className="text-sm font-medium">Notes (optional)</label><textarea rows={3} placeholder="Any extra info..." value={notes} onChange={e=>setNotes(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"/></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={()=>setOpen(false)} className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100">Cancel</button><button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700">Add Exam</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}