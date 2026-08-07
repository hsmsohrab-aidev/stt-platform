import { createClient } from '@/lib/supabase/server';
import { isEmailConfigured, sendEmail } from '@/lib/email/resend';
import {
  auditCompleteEmail,
  inviteEmail,
  tcIssuedEmail,
  verificationRequestedEmail,
} from '@/lib/email/templates';

function appBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;
  return 'http://localhost:3000';
}

async function orgEmail(organizationId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('organizations')
    .select('email')
    .eq('id', organizationId)
    .maybeSingle();
  const email = data?.email?.trim();
  return email && email.includes('@') ? email : null;
}

async function logEmailNotification(opts: {
  organizationId: string;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  actionUrl: string;
  module: string;
  sent: boolean;
  detail: string;
}) {
  const supabase = createClient();
  await supabase.from('notifications').insert({
    organization_id: opts.organizationId,
    title: opts.title,
    body: `${opts.body}${opts.sent ? '' : ` · ${opts.detail}`}`,
    severity: 'info',
    module: opts.module,
    entity_type: opts.entityType,
    entity_id: opts.entityId,
    action_url: opts.actionUrl,
    channel: opts.sent ? 'email' : 'in_app',
  });
}

export async function notifyTcIssuedWithEmail(input: {
  tcId: string;
  tcNumber: string;
  receiverOrgId: string;
  issuerOrgName: string;
  quantity: number;
  unit: string;
}): Promise<void> {
  const supabase = createClient();
  const actionUrl = `${appBaseUrl()}/tc/${input.tcId}`;

  await supabase.from('notifications').insert({
    organization_id: input.receiverOrgId,
    title: `New TC received · ${input.tcNumber}`,
    body: `${input.issuerOrgName} issued ${input.quantity} ${input.unit}. Open to verify.`,
    severity: 'info',
    module: 'tc',
    entity_type: 'transaction_certificate',
    entity_id: input.tcId,
    action_url: `/tc/${input.tcId}`,
    channel: 'in_app',
  });

  const to = await orgEmail(input.receiverOrgId);
  if (!to) return;

  const tpl = tcIssuedEmail({
    tcNumber: input.tcNumber,
    issuerOrgName: input.issuerOrgName,
    quantity: input.quantity,
    unit: input.unit,
    actionUrl,
  });
  const result = await sendEmail({
    to,
    subject: tpl.subject,
    html: tpl.html,
    tags: [{ name: 'module', value: 'tc' }],
  });

  if (result.ok) {
    await logEmailNotification({
      organizationId: input.receiverOrgId,
      title: `Email sent · ${input.tcNumber}`,
      body: `Delivered to ${to}`,
      entityType: 'transaction_certificate',
      entityId: input.tcId,
      actionUrl: `/tc/${input.tcId}`,
      module: 'tc',
      sent: true,
      detail: '',
    });
  } else if (!result.skipped) {
    await logEmailNotification({
      organizationId: input.receiverOrgId,
      title: `Email failed · ${input.tcNumber}`,
      body: result.error,
      entityType: 'transaction_certificate',
      entityId: input.tcId,
      actionUrl: `/tc/${input.tcId}`,
      module: 'tc',
      sent: false,
      detail: result.error,
    });
  }
}

export async function notifyVerificationRequestedEmail(input: {
  requestId: string;
  requestNumber: string;
  supplierOrgId: string;
  verificationType: string;
}): Promise<void> {
  const to = await orgEmail(input.supplierOrgId);
  if (!to) return;

  const tpl = verificationRequestedEmail({
    requestNumber: input.requestNumber,
    verificationType: input.verificationType,
    actionUrl: `${appBaseUrl()}/verification`,
  });
  await sendEmail({
    to,
    subject: tpl.subject,
    html: tpl.html,
    tags: [{ name: 'module', value: 'verification' }],
  });
}

export async function notifyAuditCompleteEmail(input: {
  requestId: string;
  requestNumber: string;
  buyerOrgId: string;
  reportTitle: string;
  rating: string;
}): Promise<void> {
  const to = await orgEmail(input.buyerOrgId);
  if (!to) return;

  const tpl = auditCompleteEmail({
    requestNumber: input.requestNumber,
    reportTitle: input.reportTitle,
    rating: input.rating,
    actionUrl: `${appBaseUrl()}/verification`,
  });
  await sendEmail({
    to,
    subject: tpl.subject,
    html: tpl.html,
    tags: [{ name: 'module', value: 'verification' }],
  });
}

export async function sendInviteEmail(input: {
  to: string;
  orgName: string;
  roleName: string;
  token: string;
  organizationId: string;
  inviteId: string;
}): Promise<{ sent: boolean; detail: string }> {
  const inviteUrl = `${appBaseUrl()}/invite/${input.token}`;
  const tpl = inviteEmail({
    orgName: input.orgName,
    inviteUrl,
    roleName: input.roleName,
  });
  const result = await sendEmail({
    to: input.to,
    subject: tpl.subject,
    html: tpl.html,
    tags: [{ name: 'module', value: 'membership' }],
  });

  if (result.ok) {
    return { sent: true, detail: `Email sent to ${input.to}` };
  }
  if (result.skipped) {
    return {
      sent: false,
      detail: isEmailConfigured()
        ? result.reason
        : `Email skipped (set RESEND_API_KEY). Share link: ${inviteUrl}`,
    };
  }
  return { sent: false, detail: result.error };
}
