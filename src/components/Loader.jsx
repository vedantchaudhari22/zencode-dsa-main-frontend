// Small shared loading state used across pages and panels.
// It keeps async empty states visually consistent.
export default function Loader({ message = "Loading data...", compact = false }) {
  return (
    <div className={`flex items-center justify-center ${compact ? "py-6" : "py-12"}`}>
      <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" />
        <span className="text-sm text-slate-600">{message}</span>
      </div>
    </div>
  );
}
