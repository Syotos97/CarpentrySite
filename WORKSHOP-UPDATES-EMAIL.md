Workshop Updates Email Setup

What the theme now does

- The footer email signup now tags subscribers as `newsletter,workshop-updates`.
- That gives you a clean audience segment for new-item release emails inside Shopify.

What still must be done in Shopify Admin

Theme code cannot send automated release emails by itself. To send one well-formatted email when a new item is released, finish the workflow in Shopify Admin:

1. Open Marketing in Shopify Admin.
2. Open Email or Automations.
3. Create a customer segment filtered to subscribers tagged `workshop-updates`.
4. When a new item is ready, create a single email campaign to that segment.
5. Send that campaign once for each release.

Recommended trigger model

- Best fit: send a one-time campaign when you publish a new ready-to-order item.
- Avoid a fully automatic inventory trigger unless you are certain every published item should email the whole list.
- For a custom-shop site like this one, manual send with a saved audience is safer than auto-sending on every product change.

Suggested segment filter

Use a segment that includes customers where tags contains `workshop-updates`.

Email template

Subject line:

```text
New item just released in the shop
```

Preview text:

```text
A new handcrafted piece is now available to order before it’s gone.
```

Body copy:

```html
<h1 style="margin:0 0 16px;font-size:30px;line-height:1.2;">A new handcrafted item is now live</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">A fresh piece just hit the store and is ready to order.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">If you’ve been waiting for the next release, this is the first notice going out to the workshop-updates list.</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Tap below to view the new item, check dimensions, shipping details, and availability.</p>
<p style="margin:0 0 32px;">
  <a href="{{ shop.url }}/collections/all" style="display:inline-block;padding:14px 24px;background:#8f5b31;color:#ffffff;text-decoration:none;border-radius:999px;font-size:15px;font-weight:600;">View the new release</a>
</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#6d5d50;">Custom orders are still open if the new release sells before you get there.</p>
```

Better version for each send

Before sending, replace the generic collection link with the direct product URL for the new item. Also swap the headline with the actual item name, for example:

```text
New release: Cedar Plant Holder
```

Optional improvement

- Add a product image block in Shopify Email above the button.
- Link the button directly to the new product page instead of the full catalog.
- Reuse the same saved audience each time so only workshop-update subscribers get the email.