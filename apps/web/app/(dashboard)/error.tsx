'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stt-bg px-4">
      <div className="w-full max-w-md rounded-xl border border-stt-line bg-white p-6 shadow-[var(--stt-shadow)]">
        <h2 className="font-display text-lg font-bold text-stt-ink">
          Something went wrong
        </h2>
        <p className="mt-2 text-[12px] text-stt-muted">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <Button
          type="button"
          onClick={reset}
          className="mt-4 h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
