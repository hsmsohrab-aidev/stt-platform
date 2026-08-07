'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import {
  createShipmentAction,
  type ShipmentActionState,
} from '@/app/(dashboard)/shipments/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initial: ShipmentActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Creating…' : 'Create shipment'}
    </Button>
  );
}

type Option = { id: string; label: string };

export function CreateShipmentForm({
  orders,
  counterparties,
}: {
  orders: Option[];
  counterparties: Option[];
}) {
  const [state, action] = useFormState(createShipmentAction, initial);

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
          {state.shipmentId ? (
            <>
              {' · '}
              <Link
                href={`/shipments/${state.shipmentId}`}
                className="font-semibold underline"
              >
                Track
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">
          Linked order (optional)
        </label>
        <select
          name="order_id"
          className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
          defaultValue=""
        >
          <option value="">None</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">
          Consignee org (optional)
        </label>
        <select
          name="consignee_org_id"
          className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
          defaultValue=""
        >
          <option value="">Self / unset</option>
          {counterparties.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">
            Origin port
          </label>
          <Input name="origin_port" placeholder="Chattogram" className="h-9 rounded-lg text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">
            Destination port
          </label>
          <Input name="destination_port" placeholder="Hamburg" className="h-9 rounded-lg text-xs" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">B/L number</label>
          <Input name="bl_number" className="h-9 rounded-lg font-mono-stt text-[11px]" />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Container</label>
          <Input
            name="container_number"
            className="h-9 rounded-lg font-mono-stt text-[11px]"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Weight (KG)</label>
          <Input name="total_weight_kg" type="number" step="0.01" className="h-9 rounded-lg text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">ETA</label>
          <Input name="eta" type="date" className="h-9 rounded-lg text-xs" />
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
