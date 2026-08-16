/**
 * Stock Management Utilities & Product Identifier Normalization
 */

export const DEFAULT_INITIAL_STOCK = 0;

/**
 * Standardize product titles or image filenames into clean, deterministic Firestore Document IDs.
 * Examples:
 * "Pink Hearty Cross" / "images/necklaces/pink hearty cross.jpg" -> "pink_hearty_cross"
 * "Butterfly Bloom 🦋.jpg" -> "butterfly_bloom"
 * "Celi✧Novia (1).jpeg" -> "celi_novia"
 */
export function getProductId(title, imagePath) {
  let name = title || '';
  if (!name && imagePath) {
    let filename = imagePath.split('/').pop().split('\\').pop();
    try {
      filename = decodeURIComponent(filename);
    } catch (e) {}
    name = filename.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '');
  }

  // Strip emojis and non-alphanumeric chars
  let cleaned = name.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  cleaned = cleaned.replace(/\(([0-9]+)\)/g, ''); // strip (1), (2)
  cleaned = cleaned.replace(/\s+2\.0$/i, '');
  cleaned = cleaned.toLowerCase().trim();
  cleaned = cleaned.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  return cleaned || 'unknown_product';
}

/**
 * Normalize category string for robust matching across plural/singular variations and accidental whitespace/case differences.
 * Examples: "Necklaces", "Necklace", "necklace", "  necklaces  " -> "necklace"
 */
export function normalizeCategory(cat) {
  if (!cat) return '';
  let cleaned = String(cat).trim().toLowerCase();
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  if (cleaned === 'necklaces' || cleaned === 'necklace') return 'necklace';
  if (cleaned === 'earrings' || cleaned === 'earring') return 'earring';
  if (cleaned === 'bracelets' || cleaned === 'bracelet') return 'bracelet';
  if (cleaned === 'charms' || cleaned === 'charm') return 'charm';
  if (cleaned === 'brooches' || cleaned === 'brooch') return 'brooch';
  return cleaned;
}

/**
 * Derive appropriate category name from image path or name if product category is missing or generic.
 */
export function deriveCategory(imagePath = '', name = '') {
  const str = (String(imagePath) + ' ' + String(name)).toLowerCase();
  if (str.includes('necklace')) return 'Necklaces';
  if (str.includes('earring')) return 'Earrings';
  if (str.includes('bracelet')) return 'Bracelets';
  if (str.includes('charm')) return 'Charms';
  if (str.includes('brooch')) return 'Brooches';
  return 'Jewellery';
}

import { STOREFRONT_PRODUCTS } from './product-utils.js';

/**
 * Merge storefront product catalog with Firestore inventory snapshot records cleanly without duplicates.
 */
export function combineProducts(firestoreDocs = []) {
  const fsMap = {};
  firestoreDocs.forEach(d => {
    const id = d.id || getProductId(d.name, d.image);
    if (id) fsMap[id] = d;
  });

  const result = [];
  const seenIds = new Set();

  const sourceCatalog = (typeof window !== 'undefined' && window.STOREFRONT_PRODUCTS) || STOREFRONT_PRODUCTS || [];

  sourceCatalog.forEach(dp => {
    const pId = getProductId(dp.name, dp.image);
    seenIds.add(pId);

    const fsData = fsMap[pId] || {};
    const finalCategory = fsData.category || dp.category || deriveCategory(dp.image, dp.name);
    result.push({
      id: pId,
      name: fsData.name || dp.name,
      price: typeof fsData.price === 'number' ? fsData.price : dp.price,
      category: finalCategory,
      image: fsData.image || dp.image,
      stock: typeof fsData.stock === 'number' ? fsData.stock : DEFAULT_INITIAL_STOCK,
      hasFsRecord: Boolean(fsData.id || fsData.productId)
    });
  });

  // Include any extra products found in Firestore that aren't in sourceCatalog
  Object.keys(fsMap).forEach(fsId => {
    if (!seenIds.has(fsId)) {
      const fsData = fsMap[fsId];
      result.push({
        id: fsId,
        name: fsData.name || fsId,
        price: typeof fsData.price === 'number' ? fsData.price : 0,
        category: fsData.category || deriveCategory(fsData.image, fsData.name),
        image: fsData.image || '',
        stock: typeof fsData.stock === 'number' ? fsData.stock : DEFAULT_INITIAL_STOCK,
        hasFsRecord: true
      });
      seenIds.add(fsId);
    }
  });

  return result;
}

/**
 * Render HTML stock badges based on available inventory count.
 */
export function renderStockBadge(stock) {
  const count = Number(stock);
  if (isNaN(count) || count <= 0) {
    return `<span class="stock-badge out-of-stock" style="display:inline-block; background:#ff4d4f; color:white; padding:0.2rem 0.5rem; border-radius:12px; font-size:0.75rem; font-weight:bold; margin-top:0.3rem;">Out of Stock ❌</span>`;
  }
  if (count === 1) {
    return `<span class="stock-badge low-stock" style="display:inline-block; background:#ff9c6e; color:white; padding:0.2rem 0.5rem; border-radius:12px; font-size:0.75rem; font-weight:bold; margin-top:0.3rem;">Only 1 left! 🔥</span>`;
  }
  if (count >= 2 && count <= 5) {
    return `<span class="stock-badge low-stock" style="display:inline-block; background:#fff7e6; color:#d46b08; border:1px solid #ffd591; padding:0.2rem 0.5rem; border-radius:12px; font-size:0.75rem; font-weight:bold; margin-top:0.3rem;">Only ${count} left!</span>`;
  }
  return `<span class="stock-badge in-stock" style="display:inline-block; background:#f6ffed; color:#389e0d; border:1px solid #b7eb8f; padding:0.2rem 0.5rem; border-radius:12px; font-size:0.75rem; font-weight:bold; margin-top:0.3rem;">In Stock (${count})</span>`;
}

if (typeof window !== 'undefined') {
  window.getProductId = getProductId;
  window.normalizeCategory = normalizeCategory;
  window.deriveCategory = deriveCategory;
  window.STOREFRONT_PRODUCTS = STOREFRONT_PRODUCTS;
  window.combineProducts = combineProducts;
  window.renderStockBadge = renderStockBadge;
  window.DEFAULT_INITIAL_STOCK = DEFAULT_INITIAL_STOCK;
}

