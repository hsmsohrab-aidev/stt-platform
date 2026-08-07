import { Resend } from 'resend';

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  tags?: { name: string; value: string }[];
};

export type SendEmailResult =
  | { ok: true; id: string; provider: 'resend' }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; error: string };

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getEmailFrom(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    'STT Platform <onboarding@resend.dev>'
  );
}

/** Send transactional email via Resend. No-ops (skipped) when API key missing. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) {
    return {
      ok: false,
      skipped: true,
      reason: 'RESEND_API_KEY not set — email skipped (in-app only).',
    };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  const recipients = to.map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (recipients.length === 0) {
    return { ok: false, skipped: true, reason: 'No recipient email.' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: getEmailFrom(),
      to: recipients,
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: input.tags,
    });

    if (error) {
      return { ok: false, skipped: false, error: error.message };
    }

    return { ok: true, id: data?.id ?? 'unknown', provider: 'resend' };
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      error: err instanceof Error ? err.message : 'Email send failed',
    };
  }
}
