'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { claimVerificationAction } from '@/app/(dashboard)/verification/actions';
import { Button } from '@/components/ui/button';

export function ClaimRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      className="h-7 rounded-[9px] bg-stt-green text-[11px] font-semibold hover:bg-stt-green-dark"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await claimVerificationAction(requestId);
          router.refresh();
        })
      }
    >
      {pending ? 'Claiming…' : 'Claim'}
    </Button>
  );
}
