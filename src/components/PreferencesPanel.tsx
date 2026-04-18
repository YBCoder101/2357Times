import { useState } from "react";
import { Settings2, X } from "lucide-react";
import { DEFAULT_PREFS, type Preferences } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function PreferencesPanel({ prefs, onSave }: { prefs: Preferences; onSave: (prefs: Preferences) => void }) {
  const [open, setOpen] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<Preferences>(prefs);

  const toggleDay = (day: number) => {
    setLocalPrefs(prev => ({
      ...prev,
      studyDays: prev.studyDays.includes(day)
        ? prev.studyDays.filter(d => d !== day)
        : [...prev.studyDays, day].sort()
    }));
  };

  const handleSave = () => {
    onSave(localPrefs);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Preferences"
      >
        <Settings2 className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-pop">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold">Study Preferences</h2>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Hours per day */}
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <label>Hours per day</label>
                  <span>{localPrefs.hoursPerDay}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={localPrefs.hoursPerDay}
                  onChange={(e) => setLocalPrefs(prev => ({ ...prev, hoursPerDay: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Session length */}
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <label>Session length (minutes)</label>
                  <span>{localPrefs.sessionLength}</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={120}
                  step={15}
                  value={localPrefs.sessionLength}
                  onChange={(e) => setLocalPrefs(prev => ({ ...prev, sessionLength: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Study days */}
              <div>
                <label className="text-sm font-medium block mb-2">Study days</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                        localPrefs.studyDays.includes(idx)
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start buffer days */}
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <label>Start buffer days</label>
                  <span>{localPrefs.startBufferDays}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={14}
                  step={1}
                  value={localPrefs.startBufferDays}
                  onChange={(e) => setLocalPrefs(prev => ({ ...prev, startBufferDays: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setLocalPrefs(DEFAULT_PREFS)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}