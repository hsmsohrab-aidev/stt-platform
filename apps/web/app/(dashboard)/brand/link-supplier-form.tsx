'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  linkSupplierAction,
  type LinkSupplierState,
} from '@/app/(dashboard)/brand/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: LinkSupplierState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Linking…' : 'Link supplier'}
    </Button>
  );
}

export function LinkSupplierForm() {
  const [state, formAction] = useFormState(linkSupplierAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
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

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">
          Supplier organization UUID
        </label>
        <Input
          name="supplier_org_id"
          required
          placeholder="Paste supplier org id"
          className="h-9 rounded-lg font-mono-stt text-[11px]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Tier</label>
        <select
          name="tier_level"
          defaultValue="tier_1"
          className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
        >
          {['tier_1', 'tier_2', 'tier_3', 'tier_4', 'tier_5', 'tier_6'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <SubmitButton />
    </form>
  );
}
