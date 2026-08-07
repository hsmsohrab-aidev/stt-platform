'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  updateRiskMitigationAction,
  type RiskMitigationActionState,
} from '@/app/(dashboard)/risk/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initial: RiskMitigationActionState = { error: null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      className="h-7 rounded-[9px] text-[11px]"
      disabled={pending}
    >
      {pending ? 'Saving…' : 'Save'}
    </Button>
  );
}

export function RiskMitigationControl({
  flagKey,
  status,
  note = '',
  ownerName = '',
  dueDate = '',
}: {
  flagKey: string;
  status: 'open' | 'in_progress' | 'closed';
  note?: string;
  ownerName?: string;
  dueDate?: string;
}) {
  const [state, action] = useFormState(updateRiskMitigationAction, initial);

  return (
    <form action={action} className="flex min-w-[160px] flex-col gap-1.5">
      <input type="hidden" name="flag_key" value={flagKey} />
      <select
        name="status"
        defaultValue={status}
        className="h-7 rounded-lg border border-stt-line bg-white px-1.5 text-[11px] font-semibold text-stt-ink"
      >
        <option value="open">Open</option>
        <option value="in_progress">In progress</option>
        <option value="closed">Closed</option>
      </select>
      <Input
        name="owner_name"
        defaultValue={ownerName}
        placeholder="Owner"
        className="h-7 rounded-lg text-[11px]"
      />
      <Input
        name="due_date"
        type="date"
        defaultValue={dueDate}
        className="h-7 rounded-lg text-[11px]"
      />
      <Input
        name="note"
        defaultValue={note}
        placeholder="Action note"
        className="h-7 rounded-lg text-[11px]"
      />
      <SaveButton />
      {state.error ? (
        <span className="text-[10px] text-stt-red">{state.error}</span>
      ) : null}
      {state.success ? (
        <Badge className="w-fit rounded-full bg-stt-green-soft text-[9px] text-stt-green-dark">
          Saved
        </Badge>
      ) : null}
    </form>
  );
}
