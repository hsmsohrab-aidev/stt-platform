'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  linkPassportMaterialAction,
  type DppActionState,
} from '@/app/(dashboard)/dpp/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initial: DppActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 w-full rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Linking…' : 'Link material + TC'}
    </Button>
  );
}

export type LinkMaterialOption = {
  id: string;
  name: string;
  standard: string | null;
};

export type LinkTcOption = {
  id: string;
  tc_number: string;
  tc_status: string;
  material_ids: string[];
};

export function LinkMaterialForm({
  passportId,
  materials,
  tcs,
}: {
  passportId: string;
  materials: LinkMaterialOption[];
  tcs: LinkTcOption[];
}) {
  const [state, action] = useFormState(linkPassportMaterialAction, initial);

  return (
    <form action={action} className="space-y-2.5">
      <input type="hidden" name="passport_id" value={passportId} />
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

      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase text-stt-faint">
          Material
        </label>
        <select
          name="material_id"
          required
          className="h-9 w-full rounded-[9px] border border-stt-line bg-white px-2.5 text-[12px]"
          defaultValue=""
        >
          <option value="" disabled>
            Select material
          </option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.standard ? ` · ${m.standard}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase text-stt-faint">
          Transaction certificate
        </label>
        <select
          name="tc_id"
          className="h-9 w-full rounded-[9px] border border-stt-line bg-white px-2.5 text-[12px]"
          defaultValue=""
        >
          <option value="">Optional — no TC</option>
          {tcs.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tc_number} · {t.tc_status}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase text-stt-faint">
            %
          </label>
          <Input
            name="percentage"
            type="number"
            min={0}
            max={100}
            step="0.1"
            placeholder="e.g. 60"
            className="h-9 rounded-[9px] text-[12px]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase text-stt-faint">
            Origin
          </label>
          <Input
            name="origin_country"
            placeholder="BD"
            className="h-9 rounded-[9px] text-[12px]"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase text-stt-faint">
          Certification
        </label>
        <Input
          name="certification"
          placeholder="GOTS / GRS…"
          className="h-9 rounded-[9px] text-[12px]"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
