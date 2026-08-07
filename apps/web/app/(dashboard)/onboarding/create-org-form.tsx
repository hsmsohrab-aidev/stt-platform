'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  createOrganizationAction,
  type OnboardingState,
} from '@/app/(dashboard)/onboarding/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: OnboardingState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-9 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Creating…' : 'Create organization →'}
    </Button>
  );
}

export function CreateOrgForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction] = useFormState(createOrganizationAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <p className="rounded-[9px] bg-stt-red-soft px-3 py-2 text-[11.5px] text-stt-red">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">
          Organization name
        </label>
        <Input
          name="name"
          required
          placeholder="Chattogram Apparel Ltd."
          className="h-9 rounded-lg text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">
          Organization type
        </label>
        <select
          name="org_type"
          required
          defaultValue="supplier"
          className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
        >
          <option value="supplier">Supplier / Manufacturer</option>
          <option value="brand">Brand / Buyer</option>
          <option value="auditor">Auditor / Certifier</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Country</label>
          <Input
            name="country"
            defaultValue="BD"
            className="h-9 rounded-lg text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">
            Contact email
          </label>
          <Input
            name="email"
            type="email"
            defaultValue={defaultEmail}
            className="h-9 rounded-lg text-xs"
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
