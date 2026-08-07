'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { issueTcAction, type TcActionState } from '@/app/(dashboard)/tc/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ReceiverOrgOption } from '@/lib/tc/receivers';

const initialState: TcActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Issuing…' : 'Issue TC'}
    </Button>
  );
}

type MaterialOption = { id: string; name: string; standard: string | null };

export function IssueTcForm({
  materials,
  receivers,
  orders = [],
  shipments = [],
}: {
  materials: MaterialOption[];
  receivers: ReceiverOrgOption[];
  orders?: { id: string; order_number: string }[];
  shipments?: { id: string; shipment_number: string; status: string }[];
}) {
  const [state, formAction] = useFormState(issueTcAction, initialState);
  const [query, setQuery] = useState('');
  const [receiverId, setReceiverId] = useState(receivers[0]?.id ?? '');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return receivers;
    return receivers.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.org_type.toLowerCase().includes(q)
    );
  }, [query, receivers]);

  useEffect(() => {
    if (filtered.length === 0) return;
    if (!filtered.some((r) => r.id === receiverId)) {
      setReceiverId(filtered[0].id);
    }
  }, [filtered, receiverId]);

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
          {state.tcId ? (
            <>
              {' · '}
              <Link href={`/tc/${state.tcId}`} className="font-semibold underline">
                Open certificate
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">
          Receiver organization
        </label>
        {receivers.length === 0 ? (
          <p className="rounded-[9px] border border-stt-line bg-[#F8FAFC] px-3 py-2 text-[11px] text-stt-muted">
            No receiver orgs available yet. Link a partner from Brand hub, or create
            the counterparty org first.
          </p>
        ) : (
          <>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or UUID…"
              className="h-9 rounded-lg text-xs"
            />
            <select
              name="receiver_org_id"
              required
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
            >
              {filtered.length === 0 ? (
                <option value="" disabled>
                  No matches
                </option>
              ) : (
                filtered.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.linked ? '★ ' : ''}
                    {r.name} · {r.org_type}
                  </option>
                ))
              )}
            </select>
            <p className="text-[10px] text-stt-faint">
              ★ = linked partner · {filtered.length} shown
            </p>
          </>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Material</label>
        <select
          name="material_id"
          required
          className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
          defaultValue={materials[0]?.id}
        >
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.standard ? ` · ${m.standard}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Qty (KG)</label>
          <Input
            name="quantity"
            type="number"
            step="0.001"
            min="0.001"
            required
            className="h-9 rounded-lg text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">
            Certification
          </label>
          <Input
            name="certification"
            placeholder="GOTS"
            className="h-9 rounded-lg text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Notes</label>
        <Input name="notes" className="h-9 rounded-lg text-xs" />
      </div>

      {orders.length > 0 ? (
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
                {o.order_number}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {shipments.length > 0 ? (
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">
            Linked shipment (optional)
          </label>
          <select
            name="shipment_id"
            className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
            defaultValue=""
          >
            <option value="">None</option>
            {shipments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shipment_number} · {s.status}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
