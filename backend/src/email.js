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
          <tr><td style="padding: 4px 0; color:#6d5a46;">Preferred payment</td><td style="padding:4px 0;">${order.paymentMethod || 'Not specified'}</td></tr>
        </tbody>
      </table>
      <p style="white-space: pre-wrap; background:#f4ece0; padding: 0.75rem 1rem; border-radius: 0.5rem;">${order.projectNotes || 'No additional notes.'}</p>
      ${sketchUrl ? `<p><a href="${sketchUrl}">View the customer's sketch</a></p>` : '<p>No sketch was drawn.</p>'}
      <p style="margin-top: 1.5rem;">
        <a href="${viewUrl}" style="background:#6d441e; color:#fff; padding: 0.65rem 1.25rem; border-radius: 0.4rem; text-decoration:none;">View full request &amp; manage status</a>
      </p>
      <p style="font-size: 0.8rem; color: #8a7960;">Opening this link marks the invoice as Viewed. From that page you can move it to In Progress and Awaiting Response as you work the order, and view the sketch inline.</p>
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

      <div style="background:#fff4e5; border: 1px solid #e8c88f; padding: 1rem 1.25rem; border-radius: 0.5rem; margin: 1.5rem 0;">
        <p style="margin: 0 0 0.5rem; font-weight: bold;">A note on payment</p>
        <p style="margin: 0;">
          Once you approve the final invoice, a deposit covering the cost of materials is due before work begins.
          The remaining balance is due as final payment once your piece is complete and ready to ship or be picked up.
          You will receive a follow-up email with the exact amounts and payment options once your invoice is finalized.
          Please note: once work on your project has started, the materials deposit is non-refundable.
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

export async function sendInvoiceFinalizedEmail(env, order) {
  const trackingUrl = `${env.SHOP_ORIGIN}/pages/order-status?token=${order.customerToken}`;
  const preferred = order.paymentMethod || null;
  const hasAmounts = order.totalCost != null && order.depositAmount != null;

  const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

  const paymentOptions = [
    { key: 'PayPal', detail: env.PAYPAL_LINK },
    { key: 'Venmo', detail: env.VENMO_HANDLE },
    { key: 'Zelle', detail: env.ZELLE_CONTACT },
    { key: 'Credit Card', detail: "A secure Square payment link will be sent separately once the total is confirmed." },
    { key: 'Cash', detail: 'Accepted in person at pickup or delivery.' },
  ];

  const paymentRows = paymentOptions
    .map(({ key, detail }) => {
      const isPreferred = preferred === key;
      return `<tr>
        <td style="padding: 6px 0; color:#6d5a46;">${key}${isPreferred ? ' ⭐' : ''}</td>
        <td style="padding: 6px 0;">${detail}</td>
      </tr>`;
    })
    .join('');

  const breakdownBlock = hasAmounts
    ? `
      <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
        <tbody>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Materials</td><td style="padding:4px 0; text-align:right;">${formatCurrency(order.materialsCost)}</td></tr>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Labor</td><td style="padding:4px 0; text-align:right;">${formatCurrency(order.laborCost)}</td></tr>
          <tr style="border-top: 1px solid #d8c6ab;"><td style="padding: 6px 0; font-weight:bold;">Total</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${formatCurrency(order.totalCost)}</td></tr>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Deposit due now</td><td style="padding:4px 0; text-align:right;">${formatCurrency(order.depositAmount)}</td></tr>
          <tr><td style="padding: 4px 0; color:#6d5a46;">Balance due at completion</td><td style="padding:4px 0; text-align:right;">${formatCurrency(order.balanceDue)}</td></tr>
        </tbody>
      </table>
      ${order.invoiceNotes ? `<p style="white-space: pre-wrap; background:#f4ece0; padding: 0.75rem 1rem; border-radius: 0.5rem;">${order.invoiceNotes}</p>` : ''}
    `
    : '';

  const htmlBody = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; color: #2b1d12; line-height: 1.6;">
      <h2 style="margin-bottom: 0.25rem;">Your invoice details are confirmed</h2>
      <p>Hi ${order.customerName}, we've gone over the details of your project together and your invoice is ready.</p>

      ${hasAmounts ? '<h3 style="margin-bottom: 0.25rem;">Cost breakdown</h3>' : ''}
      ${breakdownBlock}

      <div style="background:#fff4e5; border: 1px solid #e8c88f; padding: 1rem 1.25rem; border-radius: 0.5rem; margin: 1.25rem 0;">
        <p style="margin: 0 0 0.5rem; font-weight: bold;">Payment schedule</p>
        <p style="margin: 0 0 0.5rem;">
          A <strong>deposit${hasAmounts ? ` of ${formatCurrency(order.depositAmount)}` : ''}</strong> covering the cost of materials is due now, upon approval of this invoice, before work on your piece begins.
        </p>
        <p style="margin: 0;">
          The <strong>remaining balance${hasAmounts ? ` of ${formatCurrency(order.balanceDue)}` : ''}</strong> is due as final payment once your piece is complete and ready to ship or be picked up —
          it will not be shipped or handed over until this outstanding balance is paid in full.
        </p>
        <p style="margin: 0.75rem 0 0; font-weight: bold;">
          Once work on your project has started, the materials deposit is non-refundable.
        </p>
      </div>

      <p>Here's how you can send payment:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
        <tbody>${paymentRows}</tbody>
      </table>
      ${preferred ? `<p style="font-size: 0.85rem; color: #8a7960;">⭐ marks the payment method you indicated you prefer.</p>` : ''}
      <p>
        <a href="${trackingUrl}" style="background:#6d441e; color:#fff; padding: 0.65rem 1.25rem; border-radius: 0.4rem; text-decoration:none;">Track your request status</a>
      </p>
      <p style="font-size: 0.85rem; color: #8a7960;">${env.BUSINESS_NAME}</p>
    </div>
  `;

  await sendEmail(env, {
    to: order.customerEmail,
    subject: 'Your invoice details are confirmed',
    htmlBody,
  });
}

export async function sendCustomerCancellationEmail(env, order) {
  const htmlBody = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; color: #2b1d12; line-height: 1.6;">
      <h2 style="margin-bottom: 0.25rem;">Your order has been cancelled</h2>
      <p>Hi ${order.customerName}, your custom build request has been cancelled and no further action is needed. If this was a mistake or you'd like to start a new request, just reach out or submit a new build request any time.</p>
      <p style="font-size: 0.85rem; color: #8a7960;">${env.BUSINESS_NAME}</p>
    </div>
  `;

  await sendEmail(env, {
    to: order.customerEmail,
    subject: 'Your custom build request has been cancelled',
    htmlBody,
  });
}

export async function sendAdminCancellationNotice(env, order) {
  const htmlBody = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; color: #2b1d12;">
      <h2 style="margin-bottom: 0.25rem;">A customer cancelled their request</h2>
      <p><strong>${order.customerName}</strong> (${order.customerEmail}) cancelled their custom build request.</p>
    </div>
  `;

  await sendEmail(env, {
    to: env.ADMIN_EMAIL,
    subject: `Order cancelled: ${order.customerName}`,
    htmlBody,
  });
}
