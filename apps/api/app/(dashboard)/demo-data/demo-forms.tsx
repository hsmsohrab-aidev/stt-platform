'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  loadDemoDataAction,
  wipeDemoDataAction,
  type DemoActionState,
} from '@/app/(dashboard)/demo-data/actions';
import { Button } from '@/components/ui/button';

const initial: DemoActionState = { error: null };

function LoadButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-9 rounded-[9px] bg-stt-green px-4 text-xs font-semibold hover:bg-stt-green-dark"
    >
      {pending ? 'Loading demo data…' : 'Load realistic demo data'}
    </Button>
  );
}

function WipeButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      variant="outline"
      className="h-9 rounded-[9px] border-stt-red/40 text-xs font-semibold text-stt-red hover:bg-red-50"
    >
      {pending ? 'Removing…' : 'Wipe all demo data'}
    </Button>
  );
}

export function DemoDataForms({
  hasBatch,
  batchLabel,
}: {
  hasBatch: boolean;
  batchLabel: string | null;
}) {
  const [loadState, loadAction] = useFormState(loadDemoDataAction, initial);
  const [wipeState, wipeAction] = useFormState(wipeDemoDataAction, initial);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
        <h3 className="text-[13px] font-bold text-stt-ink">Load</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-stt-muted">
          Creates partner suppliers (Chattogram Apparel, Pacific Knitwear, Delta
          Spinning), SGC Global Assurance, facilities, wallets, POs, shipments,
          TCs, DPPs, verification jobs, and alerts — realistic trade names, not
          “Demo 1 / Demo 2”.
        </p>
        {hasBatch ? (
          <p className="mt-3 rounded-[9px] border border-stt-amber/30 bg-stt-amber-soft px-3 py-2 text-[11.5px] text-stt-ink">
            Active batch: <b>{batchLabel}</b>. Wipe before loading a fresh set.
          </p>
        ) : null}
        <form action={loadAction} className="mt-3">
          <LoadButton />
        </form>
        {loadState.error ? (
          <p className="mt-2 text-[12px] text-stt-red">{loadState.error}</p>
        ) : null}
        {loadState.success ? (
          <div className="mt-2 space-y-1">
            <p className="text-[12px] font-semibold text-stt-green-dark">
              {loadState.success}
            </p>
            {loadState.details?.map((d) => (
              <p key={d} className="text-[11.5px] text-stt-muted">
                · {d}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
        <h3 className="text-[13px] font-bold text-stt-ink">Wipe</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-stt-muted">
          Deletes every row created by demo batches for your organization.
          Your own org account, catalog materials, and roles are kept.
        </p>
        <form action={wipeAction} className="mt-3">
          <WipeButton />
        </form>
        {wipeState.error ? (
          <p className="mt-2 text-[12px] text-stt-red">{wipeState.error}</p>
        ) : null}
        {wipeState.success ? (
          <p className="mt-2 text-[12px] font-semibold text-stt-ink">
            {wipeState.success}
          </p>
        ) : null}
      </div>
    </div>
  );
}
