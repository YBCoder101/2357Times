import { useState } from "react";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_PREFS, type Preferences } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface PreferencesPanelProps {
  prefs: Preferences;
  onSave: (prefs: Preferences) => void;
}

export function PreferencesPanel({ prefs, onSave }: PreferencesPanelProps) {
  const [open, setOpen] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<Preferences>(prefs);

  const handleSave = () => {
    onSave(localPrefs);
    setOpen(false);
  };

  const toggleDay = (day: number) => {
    setLocalPrefs((prev) => ({
      ...prev,
      studyDays: prev.studyDays.includes(day)
        ? prev.studyDays.filter((d) => d !== day)
        : [...prev.studyDays, day].sort(),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>Study Preferences</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Hours per day: {localPrefs.hoursPerDay}</Label>
            </div>
            <Slider
              value={[localPrefs.hoursPerDay]}
              min={0.5}
              max={8}
              step={0.5}
              onValueChange={(val) =>
                setLocalPrefs((p) => ({ ...p, hoursPerDay: val[0] }))
              }
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Session length (minutes): {localPrefs.sessionLength}</Label>
            </div>
            <Slider
              value={[localPrefs.sessionLength]}
              min={15}
              max={120}
              step={15}
              onValueChange={(val) =>
                setLocalPrefs((p) => ({ ...p, sessionLength: val[0] }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Study days</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    localPrefs.studyDays.includes(idx)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Start buffer days: {localPrefs.startBufferDays}</Label>
            <Slider
              value={[localPrefs.startBufferDays]}
              min={0}
              max={14}
              step={1}
              onValueChange={(val) =>
                setLocalPrefs((p) => ({ ...p, startBufferDays: val[0] }))
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setLocalPrefs(DEFAULT_PREFS);
              }}
            >
              Reset
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}