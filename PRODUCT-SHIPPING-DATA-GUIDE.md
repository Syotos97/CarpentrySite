For automatic product-page shipping prefill, the estimator checks sources in this order:

1. Product metafields in the `custom` namespace
2. Structured lines in the product description
3. Variant weight as a last-resort weight fallback

Recommended metafields

- `custom.shipping_length`: number in inches
- `custom.shipping_width`: number in inches
- `custom.shipping_height`: number in inches
- `custom.shipping_weight`: number in pounds

Description fallback format

Add lines like these anywhere in the product description:

```text
Shipping dimensions: 36 x 18 x 18 in
Approximate weight: 28 lb
```

Notes

- The estimator reads dimensions as `length x width x height`.
- If metafields exist, they override the description values.
- If no weight is found in metafields or description, the theme falls back to the selected variant weight.