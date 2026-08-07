'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  createFacilityAction,
  type FacilityActionState,
} from '@/app/(dashboard)/facilities/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: FacilityActionState = { error: null };

const facilityTypes = [
  ['garment_factory', 'Garment factory'],
  ['spinning_mill', 'Spinning mill'],
  ['knitting_unit', 'Knitting unit'],
  ['weaving_unit', 'Weaving unit'],
  ['dyeing_unit', 'Dyeing unit'],
  ['fabric_supplier', 'Fabric supplier'],
  ['washing_unit', 'Washing unit'],
  ['warehouse', 'Warehouse'],
  ['raw_material_source', 'Raw material source'],
] as const;

const tiers = [
  ['tier_1', 'Tier 1'],
  ['tier_2', 'Tier 2'],
  ['tier_3', 'Tier 3'],
  ['tier_4', 'Tier 4'],
  ['tier_5', 'Tier 5'],
  ['tier_6', 'Tier 6'],
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Saving…' : '＋ Declare facility'}
    </Button>
  );
}

export function FacilityForm() {
  const [state, formAction] = useFormState(createFacilityAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <p className="rounded-[9px] bg-stt-red-soft px-3 py-2 text-[11.5px] text-stt-red">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-[9px] bg-stt-green-soft px-3 py-2 text-[11.5px] text-stt-green-dark">
          Facility declared.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[10.5px] font-semibold text-stt-muted">Name</label>
          <Input name="name" required placeholder="Unit-3 Sewing" className="h-9 rounded-lg text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Type</label>
          <select
            name="facility_type"
            required
            className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
            defaultValue="garment_factory"
          >
            {facilityTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Tier</label>
          <select
            name="tier_level"
            className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
            defaultValue="tier_1"
          >
            {tiers.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">City</label>
          <Input name="city" placeholder="Chattogram" className="h-9 rounded-lg text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Country</label>
          <Input name="country" defaultValue="BD" className="h-9 rounded-lg text-xs" />
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
