function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#F2F5F9;font-family:Inter,Segoe UI,sans-serif;color:#16283C">
  <div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #E3E9F1;border-radius:12px;overflow:hidden">
    <div style="background:#0E2A47;padding:16px 20px;color:#fff;font-weight:800;font-size:16px;letter-spacing:0.4px">
      S<span style="color:#12A45B">TT</span>
      <span style="display:block;font-size:10px;font-weight:500;color:#A9BCD1;margin-top:4px">SMART TRACEABILITY TECHNOLOGY</span>
    </div>
    <div style="padding:20px">${bodyHtml}</div>
    <div style="padding:12px 20px;border-top:1px solid #E3E9F1;font-size:11px;color:#5D7189">
      STT Platform · transactional notice
    </div>
  </div>
</body>
</html>`;
}

export function tcIssuedEmail(opts: {
  tcNumber: string;
  issuerOrgName: string;
  quantity: number;
  unit: string;
  actionUrl: string;
}) {
  const subject = `New TC received · ${opts.tcNumber}`;
  const html = layout(
    subject,
    `
    <h1 style="font-size:18px;margin:0 0 12px">Transaction certificate received</h1>
    <p style="font-size:13px;line-height:1.55;margin:0 0 12px">
      <b>${opts.issuerOrgName}</b> issued <b style="font-family:ui-monospace,monospace">${opts.tcNumber}</b>
      for <b>${opts.quantity} ${opts.unit}</b>.
    </p>
    <p style="font-size:13px;line-height:1.55;margin:0 0 16px">Open STT to review and verify.</p>
    <a href="${opts.actionUrl}" style="display:inline-block;background:#12A45B;color:#fff;text-decoration:none;padding:10px 14px;border-radius:9px;font-size:12px;font-weight:600">
      Open certificate
    </a>`
  );
  return { subject, html };
}

export function verificationRequestedEmail(opts: {
  requestNumber: string;
  verificationType: string;
  actionUrl: string;
}) {
  const subject = `Verification requested · ${opts.requestNumber}`;
  const html = layout(
    subject,
    `
    <h1 style="font-size:18px;margin:0 0 12px">Verification request</h1>
    <p style="font-size:13px;line-height:1.55;margin:0 0 12px">
      A brand requested <b>${opts.verificationType}</b> verification
      (<span style="font-family:ui-monospace,monospace">${opts.requestNumber}</span>).
    </p>
    <a href="${opts.actionUrl}" style="display:inline-block;background:#12A45B;color:#fff;text-decoration:none;padding:10px 14px;border-radius:9px;font-size:12px;font-weight:600">
      View request
    </a>`
  );
  return { subject, html };
}

export function auditCompleteEmail(opts: {
  requestNumber: string;
  reportTitle: string;
  rating: string;
  actionUrl: string;
}) {
  const subject = `Audit complete · ${opts.requestNumber}`;
  const html = layout(
    subject,
    `
    <h1 style="font-size:18px;margin:0 0 12px">Audit report published</h1>
    <p style="font-size:13px;line-height:1.55;margin:0 0 12px">
      <b>${opts.reportTitle}</b> · rating <b>${opts.rating}</b>
      (<span style="font-family:ui-monospace,monospace">${opts.requestNumber}</span>).
    </p>
    <a href="${opts.actionUrl}" style="display:inline-block;background:#12A45B;color:#fff;text-decoration:none;padding:10px 14px;border-radius:9px;font-size:12px;font-weight:600">
      Open verification
    </a>`
  );
  return { subject, html };
}

export function inviteEmail(opts: {
  orgName: string;
  inviteUrl: string;
  roleName: string;
}) {
  const subject = `You're invited to ${opts.orgName} on STT`;
  const html = layout(
    subject,
    `
    <h1 style="font-size:18px;margin:0 0 12px">Team invitation</h1>
    <p style="font-size:13px;line-height:1.55;margin:0 0 12px">
      Join <b>${opts.orgName}</b> as <b>${opts.roleName}</b> on STT Platform.
    </p>
    <a href="${opts.inviteUrl}" style="display:inline-block;background:#12A45B;color:#fff;text-decoration:none;padding:10px 14px;border-radius:9px;font-size:12px;font-weight:600">
      Accept invite
    </a>
    <p style="font-size:11px;color:#5D7189;margin:14px 0 0">Sign in with this email address to accept.</p>`
  );
  return { subject, html };
}
