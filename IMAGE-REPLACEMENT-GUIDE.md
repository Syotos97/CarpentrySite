# Image Replacement Guide

Use this file as a checklist while replacing stock or placeholder visuals in Shopify.

## Homepage

Template: `templates/index.json`

Section: `carpentry_showcase_Rq9fTW`

- Panel `panel_projects`
  - `image_1`: hero-quality project photo, preferably wide
  - `image_2`: detail shot such as joinery, finish, or hardware
  - `image_3`: installed-in-room photo or alternate angle
- Panel `panel_orders`
  - `image_1`: planning sketch, measured drawing, or workshop consultation photo
  - `image_2`: material sample or finish board photo
  - `image_3`: in-progress build photo
- Panel `panel_shipping`
  - `image_1`: wrapped or crated piece ready for delivery
  - `image_2`: delivery or install photo
  - `image_3`: close-up of protective packaging
- Panel `panel_reviews`
  - `image_1`: best finished project tied to a testimonial
  - `image_2`: room context photo
  - `image_3`: repeat-client or follow-up project image

## Custom Orders Page

Template: `templates/page.custom-orders.json`

Section: `custom_orders_content`

- Panel `panel_start`
  - `image_1`: intake worksheet or measuring reference image
  - `image_2`: inspiration board or sample project
  - `image_3`: client sketch or dimensional example
- Panel `panel_design`
  - `image_1`: approved drawing or CAD screenshot
  - `image_2`: wood sample or finish selection photo
  - `image_3`: shop build process photo
- Panel `panel_quote`
  - `image_1`: finished piece ready for delivery
  - `image_2`: staged install photo
  - `image_3`: material detail shot

## Shipping Page

Template: `templates/page.shipping.json`

Section: `shipping_content`

- Panel `panel_local`
  - `image_1`: local delivery vehicle or carried-in install photo
  - `image_2`: finished placement in the room
  - `image_3`: stairway or access example if useful
- Panel `panel_freight`
  - `image_1`: crated furniture photo
  - `image_2`: pallet or freight prep photo
  - `image_3`: unpacking or inspection photo
- Panel `panel_timeline`
  - `image_1`: workshop queue or build progress image
  - `image_2`: finishing stage photo
  - `image_3`: packed and ready-to-ship photo

## Reviews Page

Template: `templates/page.reviews.json`

Section: `reviews_content`

- Panel `panel_quality`
  - `image_1`: close-up of craftsmanship details
  - `image_2`: finish or wood grain photo
  - `image_3`: drawer, door, or joinery action shot
- Panel `panel_service`
  - `image_1`: install-day or client handoff photo
  - `image_2`: in-room wide shot
  - `image_3`: follow-up detail photo
- Panel `panel_outcomes`
  - `image_1`: before-and-after style result image
  - `image_2`: storage or functionality improvement photo
  - `image_3`: lifestyle context image with the finished piece

## Quote Request Page

Template: `templates/page.quote-request.json`

Section: `quote_request_details`

- Panel `panel_scope`
  - `image_1`: finished piece that represents your ideal project type
  - `image_2`: measurement reference or drawing detail
  - `image_3`: material or finish sample image
- Panel `panel_site_conditions`
  - `image_1`: installation access example
  - `image_2`: on-site measurement or template photo
  - `image_3`: delivery path or placement photo
- Panel `panel_response`
  - `image_1`: workshop build progress image
  - `image_2`: finishing or assembly photo
  - `image_3`: completed project ready for delivery

## How to update the images

1. In Shopify admin, open Online Store > Themes > Customize.
2. Open the page or homepage template that matches the section above.
3. Select the `Carpentry showcase` section.
4. Open each panel block and upload images into `Primary image`, `Secondary image`, and `Tertiary image`.
5. Save after each section is updated.

## Note on page creation

The matching templates already exist in the theme, but the actual Shopify pages still need to be created in Shopify admin and assigned these templates:

- `page.custom-orders`
- `page.shipping`
- `page.reviews`
- `page.quote-request`