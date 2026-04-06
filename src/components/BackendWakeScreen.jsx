// This is the cold-start screen for the deployed app.
// It stays on screen only while the Render backend is waking up.
function formatTimer(totalSeconds) {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
    const seconds = String(safeSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

export default function BackendWakeScreen({ secondsRemaining }) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center px-6">
            <div className="text-center space-y-6">
                <div className="font-mono text-6xl md:text-7xl tracking-tight text-indigo-500">
                    {formatTimer(secondsRemaining)}
                </div>
                <p className="text-sm md:text-base text-slate-500">
                    Backend is deployed on Render, so it usually takes up to 60 seconds from a cold start.
                </p>
            </div>
        </div>
    );
}
