'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  addShipmentEventAction,
  type ShipmentActionState,
} from '@/app/(dashboard)/shipments/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initial: ShipmentActionState = { error: null };

const EVENTS = [
  { value: 'departed', label: 'Departed' },
  { value: 'arrived_port', label: 'Arrived port' },
  { value: 'customs_cleared', label: 'Customs cleared' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'exception', label: 'Exception' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Saving…' : 'Add event'}
    </Button>
  );
}

export function AddShipmentEventForm({ shipmentId }: { shipmentId: string }) {
  const [state, action] = useFormState(addShipmentEventAction, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="shipment_id" value={shipmentId} />
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
        <label className="text-[10.5px] font-semibold text-stt-muted">Event</label>
        <select
          name="event_type"
          required
          className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
          defaultValue="departed"
        >
          {EVENTS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Location</label>
        <Input name="location" placeholder="Port / city" className="h-9 rounded-lg text-xs" />
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Description</label>
        <Input name="description" className="h-9 rounded-lg text-xs" />
      </div>

      <SubmitButton />
    </form>
  );
}
