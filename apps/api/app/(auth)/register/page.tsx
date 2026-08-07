'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { registerAction, type AuthActionState } from '@/app/(auth)/actions';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: AuthActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-9 w-full rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
      disabled={pending}
    >
      {pending ? 'Creating…' : 'Create account →'}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, initialState);

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between bg-gradient-to-br from-stt-navy-deep via-stt-navy to-[#0F3B2E] px-12 py-12 text-white lg:flex">
        <BrandLogo tone="light" size="lg" withTagline />
        <div>
          <h1 className="max-w-[420px] font-display text-[34px] font-bold leading-[1.2]">
            Join the network.
            <br />
            <span className="text-stt-green">Trace every fibre.</span>
          </h1>
          <p className="mt-3.5 max-w-[400px] text-[13px] leading-relaxed text-[#A9BCD1]">
            Create your account, then complete organization onboarding to unlock
            wallet, TC issuance, and supply chain mapping.
          </p>
        </div>
        <p className="text-[10px] text-[#5D7189]">
          Powered by SGC Global Assurance
        </p>
      </section>

      <section className="grid place-items-center bg-stt-bg px-4 py-10">
        <div className="w-full max-w-[360px] rounded-xl border border-stt-line bg-white p-6 shadow-[var(--stt-shadow)]">
          <h2 className="font-display text-[19px] font-bold text-stt-ink">
            Create account
          </h2>
          <p className="mt-1 text-[11.5px] text-stt-muted">
            Personal profile first · org setup next
          </p>

          <form action={formAction} className="mt-5 space-y-3">
            {state.error ? (
              <p className="rounded-[9px] bg-stt-red-soft px-3 py-2 text-[11.5px] text-stt-red">
                {state.error}
              </p>
            ) : null}

            <div className="space-y-1">
              <label htmlFor="full_name" className="text-[10.5px] font-semibold text-stt-muted">
                Full name
              </label>
              <Input
                id="full_name"
                name="full_name"
                required
                placeholder="Your name"
                className="h-9 rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-[10.5px] font-semibold text-stt-muted">
                Work email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@company.com"
                className="h-9 rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-[10.5px] font-semibold text-stt-muted">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="h-9 rounded-lg text-xs"
              />
            </div>

            <SubmitButton />

            <p className="text-center text-xs text-stt-muted">
              Already registered?{' '}
              <Link href="/login" className="font-semibold text-stt-blue hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
