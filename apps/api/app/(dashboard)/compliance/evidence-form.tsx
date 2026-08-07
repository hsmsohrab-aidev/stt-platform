'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  addComplianceEvidenceAction,
  type EvidenceActionState,
} from '@/app/(dashboard)/compliance/evidence-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initial: EvidenceActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 w-full rounded-[9px] bg-stt-green text-xs hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Saving…' : 'Attach evidence'}
    </Button>
  );
}

export function ComplianceEvidenceForm() {
  const [state, action] = useFormState(addComplianceEvidenceAction, initial);

  return (
    <form action={action} className="space-y-2.5">
      {state.error ? (
        <p className="rounded-[9px] bg-stt-red-soft px-3 py-2 text-[11px] text-stt-red">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-[9px] bg-stt-green-soft px-3 py-2 text-[11px] text-stt-green-dark">
          {state.success}
        </p>
      ) : null}
      <Input
        name="title"
        required
        placeholder="Evidence title (e.g. GOTS cert scan)"
        className="h-8 rounded-lg text-xs"
      />
      <Input
        name="url"
        type="url"
        placeholder="https://… document or drive link"
        className="h-8 rounded-lg text-xs"
      />
      <select
        name="related_module"
        className="flex h-8 w-full rounded-lg border border-stt-line bg-white px-2 text-xs"
        defaultValue="compliance"
      >
        <option value="compliance">Compliance</option>
        <option value="risk">Risk</option>
        <option value="verification">Verification</option>
        <option value="tc">TC</option>
        <option value="facilities">Facilities</option>
      </select>
      <Input
        name="notes"
        placeholder="Notes (optional)"
        className="h-8 rounded-lg text-xs"
      />
      <SubmitButton />
    </form>
  );
}
