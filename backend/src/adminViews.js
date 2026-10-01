import { STATUSES, STATUS_LABELS, statusIndex, escapeHtml } from './util.js';

function statusBadge(status) {
  const colors = {
    invoice_sent: '#8a6d3b',
    invoice_viewed: '#31708f',
    invoice_in_progress: '#8a6d00',
    awaiting_response: '#3c763d',
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

export function renderOrderView(order, { adminToken, sketchUrl }) {
  const currentIndex = statusIndex(order.status);
  const actions = STATUSES
    .map((status, index) => {
      if (index <= currentIndex) {
        return null;
      }
      return `<a href="/admin/action?token=${adminToken}&status=${status}">Mark ${STATUS_LABELS[status]}</a>`;
    })
    .filter(Boolean)
    .join(' ');

  const body = `
    <h2 style="margin-top:0;">Custom build request</h2>
    <p>${statusBadge(order.status)}</p>
    <table>
      <tr><td>Name</td><td><strong>${escapeHtml(order.customer_name)}</strong></td></tr>
      <tr><td>Email</td><td>${escapeHtml(order.customer_email)}</td></tr>
      <tr><td>Phone</td><td>${escapeHtml(order.customer_phone || '—')}</td></tr>
      <tr><td>Category</td><td>${escapeHtml(order.category)}${order.subcategory ? ` — ${escapeHtml(order.subcategory)}` : ''}</td></tr>
      <tr><td>Wood</td><td>${escapeHtml(order.wood_family || '—')} ${order.wood_species ? `(${escapeHtml(order.wood_species)})` : ''}</td></tr>
      <tr><td>Dimensions</td><td>${escapeHtml(order.dimensions_summary || '—')}</td></tr>
      <tr><td>Submitted</td><td>${escapeHtml(order.created_at)}</td></tr>
    </table>
    <p class="notes">${escapeHtml(order.project_notes || 'No additional notes.')}</p>
    ${sketchUrl ? `<p><strong>Sketch</strong></p><img class="sketch" src="${sketchUrl}" alt="Customer sketch">` : '<p>No sketch was drawn.</p>'}
    <div class="actions">${actions || '<em>Order is at its final status.</em>'}</div>
    <p style="margin-top:2rem;"><a class="back" href="/admin/orders">&larr; Back to order log</a></p>
  `;

  return pageShell(`Request from ${order.customer_name}`, body);
}

export function renderOrdersLog(orders, masterKey) {
  const rows = orders
    .map(
      (order) => `
      <tr>
        <td>${escapeHtml(order.created_at)}</td>
        <td>${escapeHtml(order.customer_name)}<br><small>${escapeHtml(order.customer_email)}</small></td>
        <td>${escapeHtml(order.category)}${order.subcategory ? ` — ${escapeHtml(order.subcategory)}` : ''}</td>
        <td>${statusBadge(order.status)}</td>
        <td><a href="/admin/view?token=${order.admin_token}">Open</a></td>
      </tr>`
    )
    .join('');

  const body = `
    <h2 style="margin-top:0;">Admin order log</h2>
    <table>
      <thead>
        <tr><td>Submitted</td><td>Customer</td><td>Project</td><td>Status</td><td></td></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="5">No requests yet.</td></tr>'}</tbody>
    </table>
    <p style="font-size:0.8rem;color:#8a7960;">Bookmark this page with your key: /admin/orders?key=${escapeHtml(masterKey)}</p>
  `;

  return pageShell('Admin order log', body);
}

export function renderSimpleMessage(title, message) {
  return pageShell(title, `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>`);
}
