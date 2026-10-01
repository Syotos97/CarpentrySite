// Shared constants and helpers used across the worker routes.

export const STATUSES = ['invoice_sent', 'invoice_viewed', 'invoice_in_progress', 'awaiting_response'];

export const STATUS_LABELS = {
  invoice_sent: 'Invoice Sent',
  invoice_viewed: 'Invoice Viewed',
  invoice_in_progress: 'Invoice In Progress',
  awaiting_response: 'Awaiting Your Response',
};

export function statusIndex(status) {
  return STATUSES.indexOf(status);
}

export function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.SHOP_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export function json(data, env, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(env ? corsHeaders(env) : {}),
      ...(init.headers || {}),
    },
  });
}

export function html(markup, init = {}) {
  return new Response(markup, {
    ...init,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

export function newToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}
