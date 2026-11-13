// Central data source for the Target Darts B2B trade portal demo.
// Catalogue comes from target-darts.co.uk; customers and orders are demo data.

import CATALOG, { CATEGORIES, PLAYERS } from "./catalog.js";
import CUSTOMERS, { TIERS, VOLUME_BREAKS } from "./customers.js";
import ORDERS from "./orders.js";

// An order waiting for approval has not reached the ERP yet.
ORDERS.forEach((o) => { if (o.status === "pending approval") { o.synced = false; o.erpRef = ""; } });

// ---------------------------------------------------------------- formatting
const gbpFmt = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const intFmt = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

const gbp = (n) => gbpFmt.format(n || 0);
const fmt = (n) => intFmt.format(Math.round(n || 0));
const gbpShort = (n) => {
  const v = n || 0;
  if (v >= 1000000) return `£${(v / 1000000).toFixed(2).replace(/\.?0+$/, "")}m`;
  if (v >= 10000) return `£${fmt(v / 1000)}k`;
  return gbp(v);
};

// ---------------------------------------------------------------- pricing
// product.net = base trade price ex VAT; tier + volume discounts apply on top
const volumeDiscount = (qty) => {
  let d = 0;
  VOLUME_BREAKS.forEach((b) => {
    if (qty >= b.min) d = b.discount;
  });
  return d;
};

const round2 = (n) => Math.round(n * 100) / 100;

const netPrice = (product, tierDiscount = 0, qty = 1) => {
  const disc = (tierDiscount || 0) + volumeDiscount(qty);
  return round2(product.net * ((100 - disc) / 100));
};

// retail margin for the stockist at the given buy price
const margin = (product, buy) => {
  const retailNet = product.rrp / 1.2;
  const cost = buy == null ? product.net : buy;
  return Math.round(((retailNet - cost) / retailNet) * 100);
};

// ---------------------------------------------------------------- statuses
const ORDER_STATUS = {
  new: { label: "New", css: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  "pending approval": {
    label: "Pending approval",
    css: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  },
  approved: { label: "Approved", css: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400" },
  picking: { label: "Picking", css: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400" },
  dispatched: { label: "Dispatched", css: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400" },
  delivered: { label: "Delivered", css: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400" },
  cancelled: { label: "Cancelled", css: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
};
const statusCss = (s) => (ORDER_STATUS[s] || ORDER_STATUS.new).css;
const statusLabel = (s) => (ORDER_STATUS[s] || { label: s }).label;

const stockStatus = (p) => {
  if (p.stock === 0) return { label: "Out of stock", css: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400" };
  if (p.stock < 20) return { label: "Low stock", css: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" };
  return { label: "In stock", css: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400" };
};

// ---------------------------------------------------------------- lookups & aggregates
const bySku = {};
const byId = {};
CATALOG.forEach((p) => {
  bySku[p.sku] = p;
  byId[p.id] = p;
});

const revenueByCategory = {};
const unitsBySku = {};
ORDERS.forEach((o) => {
  if (o.status === "cancelled") return;
  o.items.forEach((i) => {
    revenueByCategory[i.category] = (revenueByCategory[i.category] || 0) + i.qty * i.price;
    unitsBySku[i.sku] = (unitsBySku[i.sku] || 0) + i.qty;
  });
});

const topProducts = Object.entries(unitsBySku)
  .map(([sku, units]) => ({ sku, units, product: bySku[sku], revenue: units * (bySku[sku] ? bySku[sku].net : 0) }))
  .filter((r) => r.product)
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 8);

const topCategories = Object.entries(revenueByCategory)
  .map(([name, revenue]) => ({ name, revenue, share: Math.round((revenue / Object.values(revenueByCategory).reduce((a, b) => a + b, 0)) * 100) }))
  .sort((a, b) => b.revenue - a.revenue);

const live = ORDERS.filter((o) => o.status !== "cancelled");
const STATS = {
  // company-level demo KPIs for the trade channel
  ytdRevenue: 4468000,
  ytdGrowth: 14,
  totalAccounts: 412,
  activeAccounts: 368,
  ordersThisMonth: 318,
  revenueThisMonth: 512400,
  targetMonth: 560000,

  products: CATALOG.length,
  outOfStock: CATALOG.filter((p) => p.stock === 0).length,
  lowStock: CATALOG.filter((p) => p.stock > 0 && p.stock < 20).length,
  customers: CUSTOMERS.length,
  categories: CATEGORIES.length,
  players: PLAYERS.length,
  orders: ORDERS.length,
  ordersValue: live.reduce((s, o) => s + o.total, 0),
  pendingApproval: ORDERS.filter((o) => o.status === "pending approval").length,
  notSynced: ORDERS.filter((o) => !o.synced).length,
  avgOrder: live.reduce((s, o) => s + o.total, 0) / live.length,
};

// ---------------------------------------------------------------- signed-in users
const BUYER_ACCOUNT = CUSTOMERS[0];
const CURRENT_BUYER = {
  name: BUYER_ACCOUNT.contact,
  email: BUYER_ACCOUNT.email,
  company: BUYER_ACCOUNT.name,
  companyId: BUYER_ACCOUNT.id,
  role: "Buyer",
  city: BUYER_ACCOUNT.city,
  tier: BUYER_ACCOUNT.tier,
  discount: BUYER_ACCOUNT.discount,
  terms: BUYER_ACCOUNT.terms,
  creditLimit: BUYER_ACCOUNT.creditLimit,
  balance: BUYER_ACCOUNT.balance,
};
const CURRENT_ADMIN = {
  name: "Jess Morgan",
  email: "jess.morgan@target-darts.co.uk",
  role: "Trade Sales Manager",
  company: "Target Darts Ltd",
};
const BUYER_DISCOUNT = CURRENT_BUYER.discount;

// ---------------------------------------------------------------- cart (localStorage)
const CART_KEY = "td_cart";
const lineKey = (sku, variant) => `${sku}|${variant || ""}`;

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
};
const writeCart = (items) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (e) {
    /* demo still works without storage */
  }
  window.dispatchEvent(new CustomEvent("td-cart-changed"));
  return items;
};

const cart = {
  items() {
    return readCart().filter((i) => bySku[i.sku]);
  },
  lines() {
    return this.items().map((i) => {
      const p = bySku[i.sku];
      const price = netPrice(p, BUYER_DISCOUNT, i.qty);
      return {
        ...i,
        key: lineKey(i.sku, i.variant),
        product: p,
        price,
        discount: BUYER_DISCOUNT + volumeDiscount(i.qty),
        lineTotal: round2(price * i.qty),
      };
    });
  },
  add(sku, qty, variant) {
    const items = readCart();
    const p = bySku[sku];
    const add = qty || (p ? p.moq : 1);
    const existing = items.find((i) => lineKey(i.sku, i.variant) === lineKey(sku, variant));
    if (existing) existing.qty += add;
    else items.push({ sku, qty: add, variant: variant || "" });
    return writeCart(items);
  },
  setQty(key, qty) {
    return writeCart(readCart().map((i) => (lineKey(i.sku, i.variant) === key ? { ...i, qty: Math.max(1, qty) } : i)));
  },
  remove(key) {
    return writeCart(readCart().filter((i) => lineKey(i.sku, i.variant) !== key));
  },
  clear() {
    return writeCart([]);
  },
  count() {
    return this.items().reduce((s, i) => s + i.qty, 0);
  },
  lineCount() {
    return this.items().length;
  },
  total() {
    return round2(this.lines().reduce((s, l) => s + l.lineTotal, 0));
  },
  rrpTotal() {
    return round2(this.lines().reduce((s, l) => s + (l.product.rrp / 1.2) * l.qty, 0));
  },
};

// seed a believable basket on first visit so the cart page is never empty in a demo
try {
  if (localStorage.getItem(CART_KEY) === null) {
    const seed = ["11117", "11164", "440110"].filter((s) => bySku[s]);
    const fallback = CATALOG.filter((p) => p.bestseller && p.stock > 0).slice(0, 3).map((p) => p.sku);
    const skus = seed.length >= 2 ? seed : fallback;
    writeCart(skus.map((s) => ({ sku: s, qty: bySku[s].pack > 1 ? bySku[s].moq : 6, variant: (bySku[s].variants[0] || { values: [""] }).values[0] })));
  }
} catch (e) {
  /* ignore */
}

const TD = {
  cart,
  catalog: CATALOG,
  categories: CATEGORIES,
  players: PLAYERS,
  customers: CUSTOMERS,
  tiers: TIERS,
  volumeBreaks: VOLUME_BREAKS,
  orders: ORDERS,
  stats: STATS,
  topProducts,
  topCategories,
  bySku,
  byId,
  buyer: CURRENT_BUYER,
  admin: CURRENT_ADMIN,
  gbp,
  gbpShort,
  fmt,
  netPrice,
  volumeDiscount,
  margin,
  statusCss,
  statusLabel,
  stockStatus,
  date(d) {
    return new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  },
  ordersFor(customerId) {
    return ORDERS.filter((o) => o.customerId === customerId);
  },
  order(id) {
    return ORDERS.find((o) => o.id === id);
  },
  customer(id) {
    return CUSTOMERS.find((c) => c.id === id);
  },
  productsIn(category) {
    return CATALOG.filter((p) => p.category === category);
  },
  param(name) {
    return new URLSearchParams(window.location.search).get(name);
  },
};

window.TD = TD;

export default TD;
