'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  createPassportQrVariantAction,
  type DppActionState,
} from '@/app/(dashboard)/dpp/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initial: DppActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 w-full rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Creating…' : 'Create QR variant'}
    </Button>
  );
}

export function CreateQrVariantForm({ passportId }: { passportId: string }) {
  const [state, action] = useFormState(createPassportQrVariantAction, initial);

  return (
    <form action={action} className="space-y-2.5">
      <input type="hidden" name="passport_id" value={passportId} />
      {state.error ? (
        <p className="rounded-[9px] bg-stt-red-soft px-3 py-2 text-[11.5px] text-stt-red">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-[9px] bg-stt-green-soft px-3 py-2 text-[11.5px] text-stt-green-dark">
          {state.success}
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase text-stt-faint">
          Type
        </label>
        <select
          name="qr_type"
          className="h-9 w-full rounded-[9px] border border-stt-line bg-white px-2.5 text-[12px]"
          defaultValue="batch"
        >
          <option value="batch">Batch QR</option>
          <option value="unit">Unit QR</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase text-stt-faint">
          Code
        </label>
        <Input
          name="code"
          required
          placeholder="BATCH-2026-01 or UNIT-00042"
          className="h-9 rounded-[9px] text-[12px]"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
