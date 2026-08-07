'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { publishPassportAction } from '@/app/(dashboard)/dpp/actions';
import { Button } from '@/components/ui/button';

export function PublishPassportButton({ passportId }: { passportId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await publishPassportAction(passportId);
          router.refresh();
        })
      }
    >
      {pending ? 'Publishing…' : 'Publish DPP'}
    </Button>
  );
}
