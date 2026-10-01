import { STATUS_LABELS } from './util.js';

async function sendEmail(env, { to, subject, htmlBody }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [to],
      subject,
      html: htmlBody,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email failed (${response.status}): ${errorText}`);
  }
}

export async function sendAdminNotification(env, order) {
  const viewUrl = `${env.WORKER_BASE_URL}/admin/view?token=${order.adminToken}`;
  const sketchUrl = order.hasSketch
    ? `${env.WORKER_BASE_URL}/sketch/${order.id}?token=${order.adminToken}`
    : null;

  const htmlBody = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; color: #2b1d12;">
      <h2 style="margin-bottom: 0.25rem;">New custom build request</h2>
      <p style="color: #6d5a46; margin-top: 0;">Status: <strong>${STATUS_LABELS.invoice_sent}</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
        <tbody>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Name</td><td style="padding:4px 0;"><strong>${order.customerName}</strong></td></tr>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Email</td><td style="padding:4px 0;">${order.customerEmail}</td></tr>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Phone</td><td style="padding:4px 0;">${order.customerPhone || '—'}</td></tr>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Category</td><td style="padding:4px 0;">${order.category}${order.subcategory ? ` — ${order.subcategory}` : ''}</td></tr>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Wood</td><td style="padding:4px 0;">${order.woodFamily || '—'} ${order.woodSpecies ? `(${order.woodSpecies})` : ''}</td></tr>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Dimensions</td><td style="padding:4px 0;">${order.dimensionsSummary || '—'}</td></tr>
        </tbody>
      </table>
      <p style="white-space: pre-wrap; background:#f4ece0; padding: 0.75rem 1rem; border-radius: 0.5rem;">${order.projectNotes || 'No additional notes.'}</p>
      ${sketchUrl ? `<p><strong>Sketch:</strong></p><img src="${sketchUrl}" alt="Customer sketch" style="max-width: 100%; border: 1px solid #d8c6ab; border-radius: 0.5rem;">` : '<p>No sketch was drawn.</p>'}
      <p style="margin-top: 1.5rem;">
        <a href="${viewUrl}" style="background:#6d441e; color:#fff; padding: 0.65rem 1.25rem; border-radius: 0.4rem; text-decoration:none;">View full request &amp; manage status</a>
      </p>
      <p style="font-size: 0.8rem; color: #8a7960;">Opening this link marks the invoice as Viewed. From that page you can move it to In Progress and Awaiting Response as you work the order.</p>
    </div>
  `;

  await sendEmail(env, {
    to: env.ADMIN_EMAIL,
    subject: `New custom build request from ${order.customerName}`,
    htmlBody,
  });
}

export async function sendCustomerConfirmation(env, order) {
  const trackingUrl = `${env.SHOP_ORIGIN}/pages/order-status?token=${order.customerToken}`;

  const htmlBody = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; color: #2b1d12; line-height: 1.6;">
      <h2 style="margin-bottom: 0.25rem;">Thank you, ${order.customerName}!</h2>
      <p>Your custom build request has been received and an invoice has been started for your project. Here is a quick summary of what you sent:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
        <tbody>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Project type</td><td style="padding:4px 0;"><strong>${order.category}${order.subcategory ? ` — ${order.subcategory}` : ''}</strong></td></tr>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Wood preference</td><td style="padding:4px 0;">${order.woodFamily || '—'} ${order.woodSpecies ? `(${order.woodSpecies})` : ''}</td></tr>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Dimensions</td><td style="padding:4px 0;">${order.dimensionsSummary || '—'}</td></tr>
        </tbody>
      </table>

      <div style="background:#f4ece0; padding: 1rem 1.25rem; border-radius: 0.5rem; margin: 1.5rem 0;">
        <p style="margin: 0 0 0.5rem; font-weight: bold;">A note on timing</p>
        <p style="margin: 0;">
          Every piece is handmade to order, built, sanded, and finished by hand rather than mass produced.
          That craftsmanship is what gives a custom piece its quality and durability, but it also means your
          project may take longer than a store-bought alternative. I review every request personally and will
          follow up with an ETA and cost estimate soon. Thank you for valuing handmade work and for your patience
          while your piece gets the time and care it deserves.
        </p>
      </div>

      <p>
        <a href="${trackingUrl}" style="background:#6d441e; color:#fff; padding: 0.65rem 1.25rem; border-radius: 0.4rem; text-decoration:none;">Track your request status</a>
      </p>
      <p style="font-size: 0.85rem; color: #8a7960;">${env.BUSINESS_NAME}</p>
    </div>
  `;

  await sendEmail(env, {
    to: order.customerEmail,
    subject: 'We received your custom build request',
    htmlBody,
  });
}
