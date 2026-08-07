'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  createAlertRuleAction,
  type AlertRuleActionState,
} from '@/app/(dashboard)/alerts/rule-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initial: AlertRuleActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 rounded-[9px] bg-stt-green text-xs hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Saving…' : 'Create rule'}
    </Button>
  );
}

export function AlertRuleForm() {
  const [state, action] = useFormState(createAlertRuleAction, initial);

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
        name="name"
        required
        placeholder="Rule name (e.g. Low wallet balance)"
        className="h-8 rounded-lg text-xs"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          name="condition_type"
          className="flex h-8 rounded-lg border border-stt-line bg-white px-2 text-xs"
          defaultValue="threshold"
        >
          <option value="threshold">Low wallet (KG)</option>
          <option value="date_trigger">Cert expiry (days)</option>
        </select>
        <Input
          name="threshold"
          type="number"
          placeholder="Threshold"
          defaultValue={100}
          className="h-8 rounded-lg text-xs"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          name="module"
          className="flex h-8 rounded-lg border border-stt-line bg-white px-2 text-xs"
          defaultValue="material"
        >
          <option value="material">Material / wallet</option>
          <option value="compliance">Compliance</option>
          <option value="risk">Risk</option>
          <option value="order">Orders</option>
        </select>
        <select
          name="severity"
          className="flex h-8 rounded-lg border border-stt-line bg-white px-2 text-xs"
          defaultValue="high"
        >
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <Input
        name="description"
        placeholder="Description (optional)"
        className="h-8 rounded-lg text-xs"
      />
      <SubmitButton />
    </form>
  );
}
