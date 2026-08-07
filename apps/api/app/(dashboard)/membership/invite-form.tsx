'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  inviteMemberAction,
  type InviteActionState,
} from '@/app/(dashboard)/membership/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initial: InviteActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Creating…' : 'Create invite'}
    </Button>
  );
}

export function InviteForm() {
  const [state, action] = useFormState(inviteMemberAction, initial);

  return (
    <form action={action} className="space-y-3">
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
          Teammate email
        </label>
        <Input
          name="email"
          type="email"
          required
          placeholder="colleague@company.com"
          className="h-9 rounded-lg text-xs"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
