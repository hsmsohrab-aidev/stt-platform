export default function OnboardingLoading() {
  return (
    <div className="flex min-h-screen bg-stt-bg">
      <aside className="hidden w-[198px] shrink-0 bg-stt-navy sm:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-[58px] border-b border-stt-line bg-white" />
        <main className="flex-1 px-4 py-4">
          <div className="h-28 animate-pulse rounded-xl border border-stt-line bg-white" />
          <div className="mt-3.5 h-56 animate-pulse rounded-xl border border-stt-line bg-white" />
        </main>
      </div>
    </div>
  );
}
