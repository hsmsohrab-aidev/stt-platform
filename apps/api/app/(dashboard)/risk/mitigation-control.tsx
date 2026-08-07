'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  updateRiskMitigationAction,
  type RiskMitigationActionState,
} from '@/app/(dashboard)/risk/actions';
import { Badge } from '@/components/ui/badge';

const initial: RiskMitigationActionState = { error: null };

function PendingHint() {
  const { pending } = useFormStatus();
  return pending ? (
    <span className="text-[10px] text-stt-faint">Saving…</span>
  ) : null;
}

export function RiskMitigationControl({
  flagKey,
  status,
}: {
  flagKey: string;
  status: 'open' | 'in_progress' | 'closed';
}) {
  const [state, action] = useFormState(updateRiskMitigationAction, initial);

  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="flag_key" value={flagKey} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-7 rounded-lg border border-stt-line bg-white px-1.5 text-[11px] font-semibold text-stt-ink"
      >
        <option value="open">Open</option>
        <option value="in_progress">In progress</option>
        <option value="closed">Closed</option>
      </select>
      <PendingHint />
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
