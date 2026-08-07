'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { loginAction, type AuthActionState } from '@/app/(auth)/actions';
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
      {pending ? 'Signing in…' : 'Sign in →'}
    </Button>
  );
}

const stats = [
  ['500+', 'Factories'],
  ['25+', 'Countries'],
  ['1M+', 'Certificates'],
  ['99.9%', 'Uptime'],
];

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between bg-gradient-to-br from-stt-navy-deep via-stt-navy to-[#0F3B2E] px-12 py-12 text-white lg:flex">
        <BrandLogo tone="light" size="lg" withTagline />

        <div>
          <h1 className="max-w-[420px] font-display text-[34px] font-bold leading-[1.2]">
            One Platform.
            <br />
            Complete Transparency.
            <br />
            <span className="text-stt-green">From Source to Consumer.</span>
          </h1>
          <p className="mt-3.5 max-w-[400px] text-[13px] leading-relaxed text-[#A9BCD1]">
            End-to-end supply chain visibility, verified data, Digital Product
            Passports and compliance intelligence for the textile, apparel &amp;
            footwear industry.
          </p>
          <div className="mt-7 flex gap-6">
            {stats.map(([value, label]) => (
              <div key={label}>
                <div className="font-display text-[21px] font-bold text-stt-green">
                  {value}
                </div>
                <div className="text-[10px] tracking-wide text-[#8FA6BE]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-[#5D7189]">
          Powered by SGC Global Assurance · Advancing Trust. Enabling
          Sustainability.
        </p>
      </section>

      <section className="grid place-items-center bg-stt-bg px-4 py-10">
        <div className="w-full max-w-[360px] rounded-xl border border-stt-line bg-white p-6 shadow-[var(--stt-shadow)]">
          <h2 className="font-display text-[19px] font-bold text-stt-ink">
            Sign in to STT
          </h2>
          <p className="mt-1 text-[11.5px] text-stt-muted">
            Enterprise access · MFA enforced
          </p>

          <form action={formAction} className="mt-5 space-y-3">
            {state.error ? (
              <p className="rounded-[9px] bg-stt-red-soft px-3 py-2 text-[11.5px] text-stt-red">
                {state.error}
              </p>
            ) : null}

            <div className="space-y-1">
              <label htmlFor="email" className="text-[10.5px] font-semibold text-stt-muted">
                Work email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
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
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="h-9 rounded-lg text-xs"
              />
            </div>

            <SubmitButton />

            <Button
              type="button"
              variant="outline"
              className="h-9 w-full rounded-[9px] text-xs font-semibold"
            >
              Continue with company SSO
            </Button>

            <p className="rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11px] leading-relaxed text-[#1E4FA8]">
              Register first if you don&apos;t have an account yet — org setup
              comes after sign-in.
            </p>

            <p className="text-center text-xs text-stt-muted">
              No account?{' '}
              <Link href="/register" className="font-semibold text-stt-blue hover:underline">
                Register
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
