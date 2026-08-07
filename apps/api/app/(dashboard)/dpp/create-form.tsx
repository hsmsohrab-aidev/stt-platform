'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import {
  createPassportAction,
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
      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Saving…' : 'Create draft DPP'}
    </Button>
  );
}

export function CreatePassportForm() {
  const [state, action] = useFormState(createPassportAction, initial);

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
          {state.passportId ? (
            <>
              {' · '}
              <Link href={`/dpp/${state.passportId}`} className="font-semibold underline">
                Open
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Product name</label>
        <Input
          name="product_name"
          required
          placeholder="Men's Organic Tee · 160 GSM"
          className="h-9 rounded-lg text-xs"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">SKU</label>
          <Input name="product_sku" placeholder="TEE-ORG-160" className="h-9 rounded-lg text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">Category</label>
          <select
            name="product_category"
            className="flex h-9 w-full rounded-lg border border-stt-line bg-white px-2.5 text-xs"
            defaultValue="apparel"
          >
            <option value="apparel">Apparel</option>
            <option value="footwear">Footwear</option>
            <option value="home_textile">Home textile</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">
          Composition (e.g. 60% Organic Cotton, 40% Recycled Polyester)
        </label>
        <Input
          name="composition"
          placeholder="60% Organic Cotton, 40% Recycled Polyester"
          className="h-9 rounded-lg text-xs"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">
            Country of origin
          </label>
          <Input name="country_of_origin" placeholder="BD" className="h-9 rounded-lg text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">
            Journey step (public)
          </label>
          <Input
            name="chain_step"
            placeholder="Garment making · Chattogram Apparel"
            className="h-9 rounded-lg text-xs"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">
            CO₂e kg / unit
          </label>
          <Input
            name="carbon_footprint_kg"
            type="number"
            step="0.001"
            placeholder="2.1"
            className="h-9 rounded-lg text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold text-stt-muted">
            Water L / unit
          </label>
          <Input
            name="water_usage_liters"
            type="number"
            step="0.001"
            placeholder="28"
            className="h-9 rounded-lg text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10.5px] font-semibold text-stt-muted">Care</label>
        <Input
          name="care_instructions"
          placeholder="Wash cold 30°C · line dry · do not bleach"
          className="h-9 rounded-lg text-xs"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
