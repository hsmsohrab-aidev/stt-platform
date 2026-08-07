/** Page-slot skeleton only — layout Sidebar stays mounted during navigations. */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="h-[52px] shrink-0 border-b border-stt-line bg-stt-card" />
      <main className="flex-1 px-4 py-4">
        <div className="h-4 w-40 animate-pulse rounded bg-stt-line" />
        <div className="mt-4 h-32 animate-pulse rounded-xl border border-stt-line bg-white" />
        <div className="mt-3.5 h-48 animate-pulse rounded-xl border border-stt-line bg-white" />
      </main>
    </div>
  );
}
