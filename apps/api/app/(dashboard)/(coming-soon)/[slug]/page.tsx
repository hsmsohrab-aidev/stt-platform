import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

type PageProps = { params: { slug: string } };

/** Catch-all for roadmap modules that are not yet built. */
export default async function ComingSoonPage({ params }: PageProps) {
  // Real Assure modules — dedicated routes own these paths.
  if (
    params.slug === 'risk' ||
    params.slug === 'compliance' ||
    params.slug === 'sustainability'
  ) {
    notFound();
  }

  const title = params.slug.replace(/-/g, ' ');

  return (
    <PageWrapper title={title} description="Later · coming soon">
      <div className="mx-auto max-w-lg rounded-xl border border-stt-line bg-white p-6 shadow-[var(--stt-shadow)]">
        <Badge className="rounded-full bg-stt-amber-soft text-stt-amber">Later</Badge>
        <h2 className="mt-3 font-display text-[20px] font-bold capitalize text-stt-ink">
          {title}
        </h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-stt-muted">
          This module is on the STT roadmap and not in the current build.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild className="h-8 rounded-[9px] bg-stt-green text-xs hover:bg-stt-green-dark">
            <a href="/">Back to dashboard</a>
          </Button>
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <a href="/sustainability">Sustainability</a>
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
