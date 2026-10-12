export default function LoadingScreen({ label = "Loading..." }) {
  return <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3 text-slate-500">
    <span className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
    <p className="text-sm">{label}</p>
  </div>;
}
