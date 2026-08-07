'use client';

import { useState, useTransition } from 'react';
import { checkTcIntegrityAction } from '@/app/(dashboard)/tc/integrity-action';
import { Button } from '@/components/ui/button';

export function VerifyIntegrityButton({ tcId }: { tcId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        className="h-8 rounded-[9px] text-xs"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const res = await checkTcIntegrityAction(tcId);
            if (res.error) {
              setOk(false);
              setMessage(res.error);
              return;
            }
            setOk(Boolean(res.match));
            setMessage(
              res.match
                ? 'Hash matches anchored record.'
                : `Mismatch · stored ${res.storedHash?.slice(0, 12) ?? 'none'}… vs ${res.computedHash?.slice(0, 12)}…`
            );
          });
        }}
      >
        {pending ? 'Checking…' : 'Verify integrity'}
      </Button>
      {message ? (
        <p
          className={`text-[10px] ${
            ok ? 'text-stt-green-dark' : 'text-[#B45309]'
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
