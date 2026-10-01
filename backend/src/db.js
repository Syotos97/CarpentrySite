export async function insertOrder(env, order) {
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO orders (
      id, customer_token, admin_token, status,
      customer_name, customer_email, customer_phone,
      category, subcategory, wood_family, wood_species,
      dimension_preference, dimensions_summary, project_notes,
      has_sketch, payment_method, created_at, updated_at
    ) VALUES (?, ?, ?, 'invoice_sent', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      order.id,
      order.customerToken,
      order.adminToken,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.category,
      order.subcategory,
      order.woodFamily,
      order.woodSpecies,
      order.dimensionPreference,
      order.dimensionsSummary,
      order.projectNotes,
      order.hasSketch ? 1 : 0,
      order.paymentMethod || '',
      now,
      now
    )
    .run();

  await env.DB.prepare(
    `INSERT INTO status_log (order_id, status, changed_at) VALUES (?, 'invoice_sent', ?)`
  )
    .bind(order.id, now)
    .run();
}

export async function getOrderByAdminToken(env, adminToken) {
  return env.DB.prepare('SELECT * FROM orders WHERE admin_token = ?').bind(adminToken).first();
}

export async function getOrderByCustomerToken(env, customerToken) {
  return env.DB.prepare('SELECT * FROM orders WHERE customer_token = ?').bind(customerToken).first();
}

export async function getOrderById(env, id) {
  return env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
}

export async function listOrders(env) {
  const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  return results || [];
}

export async function getStatusHistory(env, orderId) {
  const { results } = await env.DB
    .prepare('SELECT status, changed_at FROM status_log WHERE order_id = ? ORDER BY changed_at ASC')
    .bind(orderId)
    .all();
  return results || [];
}

export async function updateStatus(env, orderId, status) {
  const now = new Date().toISOString();
  await env.DB.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
    .bind(status, now, orderId)
    .run();
  await env.DB.prepare('INSERT INTO status_log (order_id, status, changed_at) VALUES (?, ?, ?)')
    .bind(orderId, status, now)
    .run();
}
