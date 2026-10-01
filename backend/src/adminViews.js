import { STATUSES, STATUS_LABELS, statusIndex, escapeHtml } from './util.js';

function statusBadge(status) {
  const colors = {
    invoice_sent: '#8a6d3b',
    invoice_viewed: '#31708f',
    invoice_in_progress: '#8a6d00',
    awaiting_response: '#3c763d',
    cancellation_requested: '#a33',
    cancelled: '#777777',
  };
  const color = colors[status] || '#555';
  return `<span style="display:inline-block;padding:0.2rem 0.6rem;border-radius:999px;background:${color};color:#fff;font-size:0.8rem;">${STATUS_LABELS[status] || status}</span>`;
}

function pageShell(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; background: #f4ece0; color: #2b1d12; margin: 0; padding: 2rem 1rem; }
  .shell { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 1rem; padding: 2rem; box-shadow: 0 1rem 2rem rgba(32,19,9,0.08); }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  td { padding: 0.35rem 0; vertical-align: top; }
  td:first-child { color: #6d5a46; width: 40%; }
  img.sketch { max-width: 100%; border: 1px solid #d8c6ab; border-radius: 0.5rem; margin-top: 0.5rem; }
  .actions { margin-top: 1.5rem; display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .actions a { background:#6d441e; color:#fff; padding: 0.6rem 1.1rem; border-radius: 0.4rem; text-decoration:none; font-size: 0.9rem; }
  .actions a.disabled { background:#cbb89b; pointer-events:none; }
  .notes { white-space: pre-wrap; background:#f4ece0; padding: 0.75rem 1rem; border-radius: 0.5rem; }
  a.back { color:#6d441e; }
</style>
</head>
<body>
  <div class="shell">${body}</div>
</body>
</html>`;
}

function keyQuery(adminKey) {
  return adminKey ? `&key=${encodeURIComponent(adminKey)}` : '';
}

function renderAttachmentsList(order, adminToken) {
  let attachments = [];
  try {
    attachments = JSON.parse(order.attachments || '[]');
  } catch {
    attachments = [];
  }

  if (!attachments.length) {
    return '';
  }

  const items = attachments
    .map(
      (attachment) =>
        `<li><a href="/attachment/${encodeURIComponent(attachment.key)}?token=${adminToken}">${escapeHtml(attachment.name)}</a> <small>(${Math.round((attachment.size || 0) / 1000)} KB)</small></li>`
    )
    .join('');

  return `<p><strong>Attachments</strong></p><ul>${items}</ul>`;
}

export function renderOrderView(order, { adminToken, sketchUrl, adminKey }) {
  const isCancelled = Boolean(order.cancelled_at);
  const currentIndex = statusIndex(order.status);
  const awaitingIndex = statusIndex('awaiting_response');
  const hasAmounts = order.total_cost != null;
  const kq = keyQuery(adminKey);

  const actions = isCancelled
    ? ''
    : STATUSES
        .map((status, index) => {
          if (index <= currentIndex || status === 'awaiting_response') {
            return null;
          }
          return `<a href="/admin/action?token=${adminToken}&status=${status}${kq}">Mark ${STATUS_LABELS[status]}</a>`;
        })
        .filter(Boolean)
        .join(' ');

  const invoiceAction = !isCancelled && currentIndex < awaitingIndex
    ? `<a href="/admin/invoice?token=${adminToken}${kq}">${hasAmounts ? 'Edit itemized invoice' : 'Create itemized invoice & send to customer'}</a>`
    : null;

  const cancelAction = !isCancelled
    ? `<a href="/admin/cancel?token=${adminToken}${kq}" style="background:#a33;">Cancel this order</a>`
    : null;

  const dismissRequestAction = !isCancelled && order.cancellation_requested_at
    ? `<form method="POST" action="/admin/cancel/dismiss?token=${adminToken}${kq}" style="display:inline;"><button type="submit" style="background:#6d5a46;color:#fff;border:none;padding:0.6rem 1.1rem;border-radius:0.4rem;font-size:0.9rem;cursor:pointer;">Dismiss cancellation request</button></form>`
    : null;

  const invoiceSummary = hasAmounts
    ? `
      <tr><td>Materials</td><td>$${Number(order.materials_cost || 0).toFixed(2)}</td></tr>
      <tr><td>Labor</td><td>$${Number(order.labor_cost || 0).toFixed(2)}</td></tr>
      <tr><td>Total</td><td>$${Number(order.total_cost || 0).toFixed(2)}</td></tr>
      <tr><td>Deposit due</td><td>$${Number(order.deposit_amount || 0).toFixed(2)}</td></tr>
      <tr><td>Balance due</td><td>$${Number(order.balance_due || 0).toFixed(2)}</td></tr>
    `
    : '<tr><td>Invoice amounts</td><td>Not created yet</td></tr>';

  const body = `
    <h2 style="margin-top:0;">Custom build request</h2>
    <p>${statusBadge(isCancelled ? 'cancelled' : order.status)}${!isCancelled && order.cancellation_requested_at ? ` ${statusBadge('cancellation_requested')}` : ''}</p>
    ${!isCancelled && order.cancellation_requested_at ? `<p style="font-weight:bold;color:#a33;">Customer requested cancellation on ${escapeHtml(order.cancellation_requested_at)}. Reach out to them, then either cancel the order or dismiss this request.</p>` : ''}
    <table>
      <tr><td>Name</td><td><strong>${escapeHtml(order.customer_name)}</strong></td></tr>
      <tr><td>Email</td><td>${escapeHtml(order.customer_email)}</td></tr>
      <tr><td>Phone</td><td>${escapeHtml(order.customer_phone || '—')}</td></tr>
      <tr><td>Category</td><td>${escapeHtml(order.category)}${order.subcategory ? ` — ${escapeHtml(order.subcategory)}` : ''}</td></tr>
      <tr><td>Wood</td><td>${escapeHtml(order.wood_family || '—')} ${order.wood_species ? `(${escapeHtml(order.wood_species)})` : ''}</td></tr>
      <tr><td>Dimensions</td><td>${escapeHtml(order.dimensions_summary || '—')}</td></tr>
      <tr><td>Preferred payment</td><td>${escapeHtml(order.payment_method || 'Not specified')}</td></tr>
      ${invoiceSummary}
      <tr><td>Submitted</td><td>${escapeHtml(order.created_at)}</td></tr>
      ${isCancelled ? `<tr><td>Cancelled</td><td>${escapeHtml(order.cancelled_at)}</td></tr>` : ''}
    </table>
    <p class="notes">${escapeHtml(order.project_notes || 'No additional notes.')}</p>
    ${sketchUrl ? `<p><strong>Sketch</strong></p><img class="sketch" src="${sketchUrl}" alt="Customer sketch">` : '<p>No sketch was drawn.</p>'}
    ${renderAttachmentsList(order, adminToken)}
    <div class="actions">${[actions, invoiceAction, cancelAction, dismissRequestAction].filter(Boolean).join(' ') || '<em>Order is at its final status.</em>'}</div>
    <p style="margin-top:2rem;"><a class="back" href="/admin/orders${adminKey ? `?key=${encodeURIComponent(adminKey)}` : ''}">&larr; Back to order log</a></p>
  `;

  return pageShell(`Request from ${order.customer_name}`, body);
}

export function renderCancelConfirm(order, { adminToken, adminKey }) {
  const kq = keyQuery(adminKey);
  const body = `
    <h2 style="margin-top:0;">Cancel this order?</h2>
    <p>This will cancel the request from <strong>${escapeHtml(order.customer_name)}</strong> (${escapeHtml(order.customer_email)}) and notify them by email. This cannot be undone.</p>
    <p style="font-weight:bold;color:#a33;">Reminder: if work on this project has already started, the materials deposit is non-refundable.</p>
    <form method="POST" action="/admin/cancel?token=${adminToken}${kq}">
      <div class="actions">
        <button type="submit" style="background:#a33;color:#fff;border:none;padding:0.6rem 1.1rem;border-radius:0.4rem;font-size:0.9rem;cursor:pointer;">Yes, cancel this order</button>
      </div>
    </form>
    <p style="margin-top:1.5rem;"><a class="back" href="/admin/view?token=${adminToken}${kq}">&larr; No, go back</a></p>
  `;

  return pageShell(`Cancel order — ${order.customer_name}`, body);
}

export function renderInvoiceForm(order, { adminToken, adminKey }) {
  const kq = keyQuery(adminKey);
  const body = `
    <h2 style="margin-top:0;">Itemized invoice for ${escapeHtml(order.customer_name)}</h2>
    <p>${escapeHtml(order.category)}${order.subcategory ? ` — ${escapeHtml(order.subcategory)}` : ''}</p>
    <form method="POST" action="/admin/invoice?token=${adminToken}${kq}">
      <table>
        <tr>
          <td>Materials cost ($)</td>
          <td><input type="number" step="0.01" min="0" name="materialsCost" value="${order.materials_cost ?? ''}" required style="width:100%;padding:0.4rem;"></td>
        </tr>
        <tr>
          <td>Labor cost ($)</td>
          <td><input type="number" step="0.01" min="0" name="laborCost" value="${order.labor_cost ?? ''}" required style="width:100%;padding:0.4rem;"></td>
        </tr>
        <tr>
          <td>Deposit due now ($)</td>
          <td><input type="number" step="0.01" min="0" name="depositAmount" value="${order.deposit_amount ?? ''}" required style="width:100%;padding:0.4rem;"></td>
        </tr>
        <tr>
          <td>Notes to customer (optional)</td>
          <td><textarea name="invoiceNotes" rows="4" style="width:100%;padding:0.4rem;">${escapeHtml(order.invoice_notes || '')}</textarea></td>
        </tr>
      </table>
      <p style="font-size:0.85rem;color:#8a7960;">Total = Materials + Labor. Balance due = Total − Deposit. Submitting this sends the customer their finalized invoice email with this breakdown and moves the order to "Awaiting Your Response".</p>
      <div class="actions">
        <button type="submit" style="background:#6d441e;color:#fff;border:none;padding:0.6rem 1.1rem;border-radius:0.4rem;font-size:0.9rem;cursor:pointer;">Save &amp; send to customer</button>
      </div>
    </form>
    <p style="margin-top:1.5rem;"><a class="back" href="/admin/view?token=${adminToken}${kq}">&larr; Back to request</a></p>
  `;

  return pageShell(`Itemized invoice — ${order.customer_name}`, body);
}

export function renderOrdersLog(orders, masterKey, storageInfo) {
  const rows = orders
    .map(
      (order) => `
      <tr>
        <td>${escapeHtml(order.created_at)}</td>
        <td>${escapeHtml(order.customer_name)}<br><small>${escapeHtml(order.customer_email)}</small></td>
        <td>${escapeHtml(order.category)}${order.subcategory ? ` — ${escapeHtml(order.subcategory)}` : ''}</td>
        <td>${statusBadge(order.cancelled_at ? 'cancelled' : order.status)}${!order.cancelled_at && order.cancellation_requested_at ? ` ${statusBadge('cancellation_requested')}` : ''}</td>
        <td><a href="/admin/view?token=${order.admin_token}&key=${encodeURIComponent(masterKey)}">Open</a></td>
      </tr>`
    )
    .join('');

  const body = `
    <h2 style="margin-top:0;">Admin order log</h2>
    ${storageInfo ? `<p style="font-size:0.85rem;color:${storageInfo.percent >= 90 ? '#a33' : '#8a7960'};">Sketch storage used: ${storageInfo.usedMb} MB of ${storageInfo.capMb} MB cap (${storageInfo.percent}%)${storageInfo.percent >= 90 ? ' — approaching the R2 free-tier limit, new sketches will stop saving automatically before any charge occurs.' : ''}</p>` : ''}
    <table>
      <thead>
        <tr><td>Submitted</td><td>Customer</td><td>Project</td><td>Status</td><td></td></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="5">No requests yet.</td></tr>'}</tbody>
    </table>
    <p><a class="back" href="/admin/orders/past?key=${encodeURIComponent(masterKey)}">View past (cancelled) orders &rarr;</a></p>
    <p style="font-size:0.8rem;color:#8a7960;">Bookmark this page with your key: /admin/orders?key=${escapeHtml(masterKey)}</p>
  `;

  return pageShell('Admin order log', body);
}

export function renderPastOrdersLog(orders, masterKey) {
  const rows = orders
    .map(
      (order) => `
      <tr>
        <td>${escapeHtml(order.cancelled_at)}</td>
        <td>${escapeHtml(order.customer_name)}<br><small>${escapeHtml(order.customer_email)}</small></td>
        <td>${escapeHtml(order.category)}${order.subcategory ? ` — ${escapeHtml(order.subcategory)}` : ''}</td>
        <td><a href="/admin/view?token=${order.admin_token}&key=${encodeURIComponent(masterKey)}">Open</a></td>
      </tr>`
    )
    .join('');

  const body = `
    <h2 style="margin-top:0;">Past (cancelled) orders</h2>
    <p style="font-size:0.85rem;color:#8a7960;">Orders move here 24 hours after being cancelled to keep the main order log tidy.</p>
    <table>
      <thead>
        <tr><td>Cancelled</td><td>Customer</td><td>Project</td><td></td></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="4">No past orders yet.</td></tr>'}</tbody>
    </table>
    <p><a class="back" href="/admin/orders?key=${encodeURIComponent(masterKey)}">&larr; Back to order log</a></p>
  `;

  return pageShell('Past orders', body);
}

export function renderSimpleMessage(title, message) {
  return pageShell(title, `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>`);
}
