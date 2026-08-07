'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  linkTcShipmentAction,
  type TcActionState,
} from '@/app/(dashboard)/tc/actions';
import { Button } from '@/components/ui/button';

const initial: TcActionState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      className="h-8 rounded-[9px] text-xs"
      disabled={pending}
    >
      {pending ? 'Saving…' : label}
    </Button>
  );
}

export function LinkShipmentForm({
  tcId,
  shipments,
  currentShipmentId,
}: {
  tcId: string;
  shipments: { id: string; shipment_number: string; status: string }[];
  currentShipmentId: string | null;
}) {
  const [state, action] = useFormState(linkTcShipmentAction, initial);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tc_id" value={tcId} />
      <div className="min-w-[180px] flex-1 space-y-1">
        <label className="text-[10px] font-semibold uppercase text-stt-faint">
          Shipment
        </label>
        <select
          name="shipment_id"
          className="flex h-8 w-full rounded-[9px] border border-stt-line bg-white px-2 text-[11px]"
          defaultValue={currentShipmentId ?? ''}
        >
          <option value="">None</option>
          {shipments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.shipment_number} · {s.status}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton label={currentShipmentId ? 'Update link' : 'Link shipment'} />
      {state.error ? (
        <p className="w-full text-[11px] text-stt-red">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="w-full text-[11px] text-stt-green-dark">{state.success}</p>
      ) : null}
    </form>
  );
}
