Reviews Page Setup

The theme already includes the reviews page template and the reviews hub UI.

Files already in the theme:

- `templates/page.reviews.json`
- `sections/reviews-hub.liquid`

If `/pages/reviews` shows "page not found", the missing piece is usually the Shopify page resource, not the theme code.

To make the real Reviews page work in Shopify Admin:

1. Open Online Store > Pages.
2. Create a page named `Reviews` if it does not already exist.
3. Set the page handle to `reviews`.
4. In the theme template selector, assign the `page.reviews` template.
5. Save the page.

After that, links to `/pages/reviews` will open the dedicated reviews page with:

- existing review cards
- a create-review form
- a 1 to 5 star rating selector

If a Reviews page already exists with a different handle, either:

- change its handle to `reviews`, or
- update the navigation/menu link to the existing page URL in Shopify Admin.