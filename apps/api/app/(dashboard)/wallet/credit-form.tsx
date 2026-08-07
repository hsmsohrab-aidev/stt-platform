'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  creditWalletAction,
  type WalletActionState,
} from '@/app/(dashboard)/wallet/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: WalletActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Posting…' : '＋ Credit balance'}
    </Button>
  );
}

type MaterialOption = { id: string; name: string; standard: string | null };

export function CreditForm({ materials }: { materials: MaterialOption[] }) {
  const [state, formAction] = useFormState(creditWalletAction, initialState);

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
        <label className="text-[10.5px] font-semibold text-stt-muted">Material</label>
        <select
          name="material_id"
          required
          className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
          defaultValue={materials[0]?.id}
        >
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.standard ? ` · ${m.standard}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">
          Quantity (KG)
        </label>
        <Input
          name="quantity"
          type="number"
          step="0.001"
          min="0.001"
          required
          placeholder="1000"
          className="h-9 rounded-lg text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Note</label>
        <Input
          name="description"
          placeholder="Opening balance / received lot"
          className="h-9 rounded-lg text-xs"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
