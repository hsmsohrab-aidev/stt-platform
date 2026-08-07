'use client';

import { Button } from '@/components/ui/button';

export function PrintTcButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-8 rounded-[9px] text-xs font-semibold print:hidden"
      onClick={() => window.print()}
    >
      Print / Save PDF
    </Button>
  );
}
