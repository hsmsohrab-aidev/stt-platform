'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  createVerificationRequestAction,
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
      {pending ? 'Submitting…' : 'Request verification'}
    </Button>
  );
}

type SupplierOption = { id: string; name: string };

export function CreateVerificationForm({
  suppliers,
}: {
  suppliers: SupplierOption[];
}) {
  const [state, action] = useFormState(createVerificationRequestAction, initial);

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
        <label className="text-[10.5px] font-semibold text-stt-muted">Supplier</label>
        {suppliers.length === 0 ? (
          <p className="text-[11px] text-stt-muted">Link a supplier first (Brand hub).</p>
        ) : (
          <select
            name="supplier_org_id"
            required
            className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
            defaultValue={suppliers[0]?.id}
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Type</label>
        <select
          name="verification_type"
          className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
          defaultValue="physical"
        >
          <option value="physical">Physical / on-site</option>
          <option value="certificate">Certificate review</option>
          <option value="social">Social compliance</option>
          <option value="esg">ESG assessment</option>
          <option value="supply_chain">Supply chain</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Scope</label>
        <Input
          name="scope"
          placeholder="Tier-1 garment facility · GOTS scope"
          className="h-9 rounded-lg text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">
          Standards (comma-separated)
        </label>
        <Input name="standards" placeholder="GOTS, SA8000" className="h-9 rounded-lg text-xs" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Deadline</label>
          <Input name="deadline_date" type="date" className="h-9 rounded-lg text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">
            Budget max (USD)
          </label>
          <Input name="budget_max_usd" type="number" step="1" className="h-9 rounded-lg text-xs" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Notes</label>
        <Input name="notes" className="h-9 rounded-lg text-xs" />
      </div>

      <SubmitButton />
    </form>
  );
}
