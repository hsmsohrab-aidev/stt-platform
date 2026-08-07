'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  completeVerificationAction,
  type VerificationActionState,
} from '@/app/(dashboard)/verification/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initial: VerificationActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Publishing…' : 'Publish report'}
    </Button>
  );
}

export function CompleteVerificationForm({
  assignmentId,
  requestId,
}: {
  assignmentId: string;
  requestId: string;
}) {
  const [state, action] = useFormState(completeVerificationAction, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <input type="hidden" name="request_id" value={requestId} />
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
        <label className="text-[10.5px] font-semibold text-stt-muted">Report title</label>
        <Input
          name="report_title"
          required
          placeholder="On-site social compliance audit"
          className="h-9 rounded-lg text-xs"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Rating</label>
          <select
            name="overall_rating"
            className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
            defaultValue="pass"
          >
            <option value="pass">Pass</option>
            <option value="pass_with_conditions">Pass with conditions</option>
            <option value="fail">Fail</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Score</label>
          <Input
            name="score"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="86"
            className="h-9 rounded-lg text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Findings summary</label>
        <Input name="findings_summary" className="h-9 rounded-lg text-xs" />
      </div>

      <label className="flex items-start gap-2 rounded-lg border border-stt-line bg-[#F8FAFC] px-3 py-2 text-[11px] leading-relaxed text-stt-ink">
        <input
          type="checkbox"
          name="digital_attestation"
          value="1"
          required
          className="mt-0.5"
        />
        <span>
          I digitally attest this report is accurate and authorize publish for the
          buyer (verified badge).
        </span>
      </label>

      <SubmitButton />
    </form>
  );
}
