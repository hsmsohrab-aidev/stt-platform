import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  /** Show stacked tagline beside the mark (sidebar / login) */
  withTagline?: boolean;
  /** light = white/green on dark; dark = navy/green on light */
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
};

const sizes = {
  sm: { h: 28, tag: 'text-[8px] leading-[1.15]' },
  md: { h: 32, tag: 'text-[9px] leading-[1.2]' },
  lg: { h: 40, tag: 'text-[10px] leading-[1.25]' },
};

/**
 * STT wordmark aligned to the product mockup:
 * S (ink) · T (green) · T (ink), with diagonal slash through T crossbars.
 */
export function BrandLogo({
  className,
  withTagline = true,
  tone = 'light',
  size = 'md',
}: BrandLogoProps) {
  const s = sizes[size];
  const ink = tone === 'light' ? '#FFFFFF' : '#0E2A47';
  const green = '#12A45B';
  const muted = tone === 'light' ? '#8FA6BE' : '#5D7189';
  const w = Math.round(s.h * 1.85);

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <svg
        width={w}
        height={s.h}
        viewBox="0 0 86 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="STT"
        role="img"
        className="shrink-0"
      >
        {/* S */}
        <path
          d="M20.5 13.1c-1.2-3.8-4.6-5.9-9.1-5.9-5.6 0-9.5 3.1-9.5 7.6 0 3.9 2.4 5.9 7.9 7.5l2.8.85c3.5 1.05 5 2 5 4.1 0 2.55-2.25 4-5.45 4-3.1 0-5.45-1.35-6.3-4.15L.6 29.7C2.55 34.4 7 38 14.1 38c6.85 0 11.55-3.55 11.55-9.05 0-4.4-2.65-6.85-8.65-8.65l-2.9-.85c-2.9-.85-4.15-1.7-4.15-3.45 0-2 1.85-3.4 4.6-3.4 2.45 0 4.3 1.15 5.05 3.35l5.9-1.55z"
          fill={ink}
        />
        {/* T1 green with slash cut in crossbar */}
        <path
          fill={green}
          fillRule="evenodd"
          d="M30 7.2h19.2v5.6H43.4v23.6h-6.2V12.8H30V7.2zm1.1 0.9 17 5.1v-1.35L32.4 7.2H31.1z"
        />
        {/* T2 ink with slash cut */}
        <path
          fill={ink}
          fillRule="evenodd"
          d="M53.2 7.2H72.4v5.6h-5.8v23.6h-6.2V12.8h-5.8V7.2zm1.1 0.9 17 5.1v-1.35L55.6 7.2H54.3z"
        />
      </svg>

      {withTagline ? (
        <span
          className={cn(
            'hidden min-[180px]:block border-l pl-2.5 font-medium uppercase tracking-[1.3px]',
            s.tag
          )}
          style={{ borderColor: `${muted}66`, color: muted }}
        >
          Supply Chain
          <br />
          Tracking &amp; Traceability
        </span>
      ) : null}
    </div>
  );
}
