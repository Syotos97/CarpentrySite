# Carpentry invoice backend

Cloudflare Worker that powers the custom build form: stores each request, emails you a
notification (with the sketch image embedded), emails the customer a confirmation with a
tracking link, and lets you move an order through its status (Invoice Sent → Invoice Viewed →
Invoice In Progress → Awaiting Response) by clicking links in the notification email or from the
admin order log page.

## One-time setup

1. Install dependencies: `npm install` (inside `backend/`).
2. Create a [Resend](https://resend.com) account, verify a sending domain, and create an API key.
3. Log into Cloudflare: `npx wrangler login`.
4. Create the database and bucket:
   ```
   npx wrangler d1 create carpentry-invoices
   npx wrangler r2 bucket create carpentry-invoice-sketches
   ```
   Copy the `database_id` printed by the first command into `wrangler.toml`.
5. Edit `wrangler.toml` vars:
   - `SHOP_ORIGIN` — your storefront URL (e.g. `https://yourshop.com`).
   - `WORKER_BASE_URL` — filled in after first deploy (the `*.workers.dev` URL, or your custom domain).
   - `FROM_EMAIL` — a sender address on your verified Resend domain.
   - `ADMIN_EMAIL` — where request notifications should go (your inbox).
   - `BUSINESS_NAME` — shown in customer emails.
6. Set secrets:
   ```
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put ADMIN_MASTER_KEY   # any long random string, used for /admin/orders
   ```
7. Run the migration:
   ```
   npm run db:migrate:remote
   ```
8. Deploy:
   ```
   npm run deploy
   ```
   Update `WORKER_BASE_URL` in `wrangler.toml` to the deployed URL and redeploy.

## Theme configuration

In the Shopify theme editor, open the **Custom project builder** section and the **Order status
tracker** section (on the `page.order-status` template) and set the **API endpoint** setting to
your deployed Worker URL (no trailing slash), e.g. `https://carpentry-invoice-backend.yourname.workers.dev`.

Create a page in Shopify admin with the handle `order-status` (Online Store → Pages → Add page,
set the URL handle to `order-status`) using the `page.order-status` template, so the tracking link
in the confirmation email resolves.

## Your admin workflow

- Each new request sends you an email with a **View full request & manage status** link.
- Opening that link marks the invoice **Viewed** and shows a page with buttons to mark it
  **In Progress** or **Awaiting Response** (statuses only move forward).
- See every request at `https://<your-worker-url>/admin/orders?key=<ADMIN_MASTER_KEY>` — bookmark
  this with your key included.
