'use client';

import { useTransition } from 'react';
import { verifyTcAction } from '@/app/(dashboard)/tc/verify-action';
import { Button } from '@/components/ui/button';

export function VerifyTcButton({ tcId }: { tcId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="h-7 rounded-[7px] text-[11px] font-semibold"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await verifyTcAction(tcId);
          if (result.error) {
            window.alert(result.error);
          }
        });
      }}
    >
      {pending ? '…' : 'Verify'}
    </Button>
  );
}
