'use client';

import { useTransition } from 'react';
import { unlinkPassportMaterialAction } from '@/app/(dashboard)/dpp/actions';
import { Button } from '@/components/ui/button';

export function UnlinkMaterialButton({
  linkId,
  passportId,
}: {
  linkId: string;
  passportId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="h-7 rounded-[7px] text-[10px]"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await unlinkPassportMaterialAction(linkId, passportId);
        });
      }}
    >
      {pending ? '…' : 'Unlink'}
    </Button>
  );
}
