'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  createOrderAction,
  type OrderActionState,
} from '@/app/(dashboard)/orders/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: OrderActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Creating…' : 'Create order'}
    </Button>
  );
}

type SupplierOption = { id: string; name: string };

export function CreateOrderForm({ suppliers }: { suppliers: SupplierOption[] }) {
  const [state, formAction] = useFormState(createOrderAction, initialState);

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
        <label className="text-[10.5px] font-semibold text-stt-muted">Supplier</label>
        {suppliers.length === 0 ? (
          <p className="text-[11px] text-stt-muted">
            Link a supplier from Brand hub first.
          </p>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">PO number</label>
          <Input name="po_number" placeholder="PO-7731" className="h-9 rounded-lg text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Season</label>
          <Input name="season" placeholder="SS2026" className="h-9 rounded-lg text-xs" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">
          Line description
        </label>
        <Input
          name="description"
          required
          placeholder="Finished garments — style A12"
          className="h-9 rounded-lg text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Qty (pcs)</label>
        <Input
          name="quantity"
          type="number"
          min={1}
          required
          className="h-9 rounded-lg text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Notes</label>
        <Input name="notes" className="h-9 rounded-lg text-xs" />
      </div>

      <SubmitButton />
    </form>
  );
}
