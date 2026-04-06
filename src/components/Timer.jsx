// This timer is a lightweight practice companion for the IDE page.
// It is intentionally local-only, so users can start, pause, or reset without hitting the backend.
import { useState, useEffect } from "react";
import { PlayIcon, PauseIcon, ArrowPathIcon } from "@heroicons/react/24/solid";

export default function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let interval;

    if (running) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [running]);

  const formatTime = () => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex items-center gap-3 bg-white text-slate-700 px-4 py-2 rounded-full shadow-sm border border-slate-200 w-fit">
      
      {/* Time */}
      <span className="font-mono text-lg tracking-wide">
        {formatTime()}
      </span>

      {/* Start / Pause */}
      {!running ? (
        <button onClick={() => setRunning(true)} className="text-green-500 hover:text-green-600 transition">
          <PlayIcon className="w-5 h-5" />
        </button>
      ) : (
        <button onClick={() => setRunning(false)} className="text-amber-500 hover:text-amber-600 transition">
          <PauseIcon className="w-5 h-5" />
        </button>
      )}

      {/* Reset */}
      <button onClick={() => { setRunning(false); setSeconds(0);} }className="text-slate-400 hover:text-slate-600 transition">
        <ArrowPathIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
