# Target Darts - B2B Trade Portal Demo

A personalised B2B trade portal demo for Target Darts, built by SyncSpider / b2bware.com on the same template as the Harrows Darts portal. The products, images, descriptions and RRPs come from Target's public catalogue. Trade prices, stockists and orders are fictional.

## Run locally

```
npm install
npx webpack --config webpack.config.js
python -m http.server 3010 --directory build
```

Then open http://localhost:3010/b2b-login.html (buyer) or http://localhost:3010/index.html (admin).

## Data

All pages read from `window.TD` in `src/js/data/td.js`, which loads:

| File | Contents |
| --- | --- |
| `src/js/data/catalog.js` | 761 products, categories and player ranges (generated) |
| `src/js/data/customers.js` | 12 fictional stockists and the trade tiers |
| `src/js/data/orders.js` | 48 fictional trade orders |
| `src/images/product/target/` | Product images as WebP |

The cart is kept in localStorage under `td_cart`.

## Pages

| Buyer | Admin |
| --- | --- |
| b2b-login, buyer-dashboard, buyer-products, buyer-product-detail, buyer-cart, buyer-checkout, buyer-orders, buyer-bulk-upload, buyer-budget | index, orders-panel, order-detail, product-management, user-management, customer-config |
