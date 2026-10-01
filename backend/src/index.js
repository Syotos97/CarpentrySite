import { corsHeaders, json, html, newToken, statusIndex, STATUSES } from './util.js';
import {
  insertOrder,
  getOrderByAdminToken,
  getOrderByCustomerToken,
  listOrders,
  getStatusHistory,
  updateStatus,
  getOrderById,
  setInvoiceAmounts,
  getTotalSketchBytes,
  adjustSketchBytes,
  cancelOrder,
} from './db.js';
import {
  sendAdminNotification,
  sendCustomerConfirmation,
  sendInvoiceFinalizedEmail,
  sendCustomerCancellationEmail,
  sendAdminCancellationNotice,
} from './email.js';
import { renderOrderView, renderOrdersLog, renderSimpleMessage, renderInvoiceForm, renderCancelConfirm } from './adminViews.js';

function dataUrlToBytes(dataUrl) {
  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl || '');
  if (!match) {
    return null;
  }
  const binary = atob(match[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function handleSubmit(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request body.' }, env, { status: 400 });
  }

  const customerName = (payload.customerName || '').trim();
  const customerEmail = (payload.customerEmail || '').trim();

  if (!customerName || !customerEmail || !payload.category) {
    return json({ ok: false, error: 'Name, email, and project category are required.' }, env, { status: 400 });
  }

  const id = crypto.randomUUID();
  const customerToken = newToken();
  const adminToken = newToken();

  const sketchBytes = dataUrlToBytes(payload.sketchImage);
  let hasSketch = Boolean(sketchBytes && sketchBytes.length);
  let sketchOmittedNote = '';

  if (hasSketch) {
    const cap = Number(env.R2_STORAGE_CAP_BYTES) || 9_000_000_000;
    const currentTotal = await getTotalSketchBytes(env);

    if (currentTotal + sketchBytes.length > cap) {
      // Safety cap reached: skip storing the sketch rather than risk exceeding R2's free tier.
      hasSketch = false;
      sketchOmittedNote = '\n\n(Note: the sketch could not be saved because the storage safety cap was reached. Follow up with the customer directly for an image.)';
    } else {
      await env.SKETCHES.put(`${id}.png`, sketchBytes, {
        httpMetadata: { contentType: 'image/png' },
      });
      await adjustSketchBytes(env, sketchBytes.length);
    }
  }

  const order = {
    id,
    customerToken,
    adminToken,
    customerName,
    customerEmail,
    customerPhone: (payload.customerPhone || '').trim(),
    category: payload.category,
    subcategory: payload.subcategory || '',
    woodFamily: payload.woodFamily || '',
    woodSpecies: payload.woodSpecies || '',
    dimensionPreference: payload.dimensionPreference || '',
    dimensionsSummary: payload.dimensionsSummary || '',
    projectNotes: (payload.projectNotes || '') + sketchOmittedNote,
    paymentMethod: payload.paymentMethod || '',
    hasSketch,
    sketchBytes: hasSketch ? sketchBytes.length : 0,
  };

  await insertOrder(env, order);

  try {
    await Promise.all([sendAdminNotification(env, order), sendCustomerConfirmation(env, order)]);
  } catch (error) {
    // Order is already saved; surface the email failure but don't lose the submission.
    return json(
      { ok: true, trackingUrl: `${env.SHOP_ORIGIN}/pages/order-status?token=${customerToken}`, emailError: String(error) },
      env,
      { status: 200 }
    );
  }

  return json({ ok: true, trackingUrl: `${env.SHOP_ORIGIN}/pages/order-status?token=${customerToken}` }, env);
}

async function handleStatus(request, env, url) {
  const token = url.searchParams.get('token');
  if (!token) {
    return json({ ok: false, error: 'Missing token.' }, env, { status: 400 });
  }

  const order = await getOrderByCustomerToken(env, token);
  if (!order) {
    return json({ ok: false, error: 'Request not found.' }, env, { status: 404 });
  }

  const history = await getStatusHistory(env, order.id);

  return json(
    {
      ok: true,
      status: order.cancelled_at ? 'cancelled' : order.status,
      cancelled: Boolean(order.cancelled_at),
      category: order.category,
      subcategory: order.subcategory,
      createdAt: order.created_at,
      history,
    },
    env
  );
}

async function handleSketch(env, url, pathname) {
  const id = pathname.replace('/sketch/', '');
  const token = url.searchParams.get('token');
  const order = await getOrderById(env, id);

  if (!order || order.admin_token !== token) {
    return new Response('Not found', { status: 404 });
  }

  const object = await env.SKETCHES.get(`${id}.png`);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(object.body, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=3600' },
  });
}

async function handleAdminView(env, url) {
  const token = url.searchParams.get('token');
  const order = await getOrderByAdminToken(env, token);

  if (!order) {
    return html(renderSimpleMessage('Not found', 'No request matches this link.'), { status: 404 });
  }

  if (!order.cancelled_at && order.status === 'invoice_sent') {
    await updateStatus(env, order.id, 'invoice_viewed');
    order.status = 'invoice_viewed';
  }

  const sketchUrl = order.has_sketch ? `/sketch/${order.id}?token=${token}` : null;

  return html(renderOrderView(order, { adminToken: token, sketchUrl }));
}

async function handleAdminAction(env, url) {
  const token = url.searchParams.get('token');
  const nextStatus = url.searchParams.get('status');
  const order = await getOrderByAdminToken(env, token);

  if (!order) {
    return html(renderSimpleMessage('Not found', 'No request matches this link.'), { status: 404 });
  }

  // Awaiting Response must go through the itemized invoice form so the customer always gets a cost breakdown.
  if (STATUSES.includes(nextStatus) && nextStatus !== 'awaiting_response' && statusIndex(nextStatus) > statusIndex(order.status)) {
    await updateStatus(env, order.id, nextStatus);
  }

  return Response.redirect(`${env.WORKER_BASE_URL}/admin/view?token=${token}`, 302);
}

async function handleAdminInvoiceForm(env, url) {
  const token = url.searchParams.get('token');
  const order = await getOrderByAdminToken(env, token);

  if (!order) {
    return html(renderSimpleMessage('Not found', 'No request matches this link.'), { status: 404 });
  }

  return html(renderInvoiceForm(order, { adminToken: token }));
}

async function handleAdminInvoiceSubmit(request, env, url) {
  const token = url.searchParams.get('token');
  const order = await getOrderByAdminToken(env, token);

  if (!order) {
    return html(renderSimpleMessage('Not found', 'No request matches this link.'), { status: 404 });
  }

  const formData = await request.formData();
  const materialsCost = Number.parseFloat(formData.get('materialsCost')) || 0;
  const laborCost = Number.parseFloat(formData.get('laborCost')) || 0;
  const depositAmount = Number.parseFloat(formData.get('depositAmount')) || 0;
  const invoiceNotes = (formData.get('invoiceNotes') || '').toString().trim();
  const totalCost = materialsCost + laborCost;
  const balanceDue = Math.max(totalCost - depositAmount, 0);

  await setInvoiceAmounts(env, order.id, { materialsCost, laborCost, totalCost, depositAmount, balanceDue, invoiceNotes });

  if (statusIndex('awaiting_response') > statusIndex(order.status)) {
    await updateStatus(env, order.id, 'awaiting_response');
  }

  await sendInvoiceFinalizedEmail(env, {
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerToken: order.customer_token,
    paymentMethod: order.payment_method,
    materialsCost,
    laborCost,
    totalCost,
    depositAmount,
    balanceDue,
    invoiceNotes,
  });

  return Response.redirect(`${env.WORKER_BASE_URL}/admin/view?token=${token}`, 302);
}

async function handleAdminOrders(env, url) {
  const key = url.searchParams.get('key');
  if (!key || key !== env.ADMIN_MASTER_KEY) {
    return html(renderSimpleMessage('Forbidden', 'Missing or invalid admin key.'), { status: 403 });
  }

  const orders = await listOrders(env);
  const cap = Number(env.R2_STORAGE_CAP_BYTES) || 9_000_000_000;
  const used = await getTotalSketchBytes(env);
  const storageInfo = {
    usedMb: (used / 1_000_000).toFixed(1),
    capMb: (cap / 1_000_000).toFixed(0),
    percent: Math.min(100, Math.round((used / cap) * 100)),
  };

  return html(renderOrdersLog(orders, key, storageInfo));
}

async function handleCancelByCustomer(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request body.' }, env, { status: 400 });
  }

  const order = await getOrderByCustomerToken(env, payload.token);
  if (!order) {
    return json({ ok: false, error: 'Request not found.' }, env, { status: 404 });
  }

  if (order.cancelled_at) {
    return json({ ok: true, alreadyCancelled: true }, env);
  }

  if (order.has_sketch) {
    await env.SKETCHES.delete(`${order.id}.png`);
    await adjustSketchBytes(env, -(order.sketch_bytes || 0));
  }

  await cancelOrder(env, order.id);

  await sendAdminCancellationNotice(env, {
    customerName: order.customer_name,
    customerEmail: order.customer_email,
  });

  return json({ ok: true }, env);
}

async function handleAdminCancelForm(env, url) {
  const token = url.searchParams.get('token');
  const order = await getOrderByAdminToken(env, token);

  if (!order) {
    return html(renderSimpleMessage('Not found', 'No request matches this link.'), { status: 404 });
  }

  return html(renderCancelConfirm(order, { adminToken: token }));
}

async function handleAdminCancelSubmit(env, url) {
  const token = url.searchParams.get('token');
  const order = await getOrderByAdminToken(env, token);

  if (!order) {
    return html(renderSimpleMessage('Not found', 'No request matches this link.'), { status: 404 });
  }

  if (!order.cancelled_at) {
    if (order.has_sketch) {
      await env.SKETCHES.delete(`${order.id}.png`);
      await adjustSketchBytes(env, -(order.sketch_bytes || 0));
    }

    await cancelOrder(env, order.id);

    await sendCustomerCancellationEmail(env, {
      customerName: order.customer_name,
      customerEmail: order.customer_email,
    });
  }

  return Response.redirect(`${env.WORKER_BASE_URL}/admin/view?token=${token}`, 302);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    try {
      if (pathname === '/submit' && request.method === 'POST') {
        return await handleSubmit(request, env);
      }
      if (pathname === '/status' && request.method === 'GET') {
        return await handleStatus(request, env, url);
      }
      if (pathname.startsWith('/sketch/') && request.method === 'GET') {
        return await handleSketch(env, url, pathname);
      }
      if (pathname === '/admin/view' && request.method === 'GET') {
        return await handleAdminView(env, url);
      }
      if (pathname === '/admin/action' && request.method === 'GET') {
        return await handleAdminAction(env, url);
      }
      if (pathname === '/admin/invoice' && request.method === 'GET') {
        return await handleAdminInvoiceForm(env, url);
      }
      if (pathname === '/admin/invoice' && request.method === 'POST') {
        return await handleAdminInvoiceSubmit(request, env, url);
      }
      if (pathname === '/cancel' && request.method === 'POST') {
        return await handleCancelByCustomer(request, env);
      }
      if (pathname === '/admin/cancel' && request.method === 'GET') {
        return await handleAdminCancelForm(env, url);
      }
      if (pathname === '/admin/cancel' && request.method === 'POST') {
        return await handleAdminCancelSubmit(env, url);
      }
      if (pathname === '/admin/orders' && request.method === 'GET') {
        return await handleAdminOrders(env, url);
      }
    } catch (error) {
      return json({ ok: false, error: String(error) }, env, { status: 500 });
    }

    return new Response('Not found', { status: 404 });
  },
};
