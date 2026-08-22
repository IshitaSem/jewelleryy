/**
 * Stock Management Utilities & Product Identifier Normalization
 */

export const DEFAULT_INITIAL_STOCK = 10;

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
    filename = filename.replace(/[-_][a-zA-Z0-9]{6,12}[-_]?(?=\.\w+$|$)/gi, '');
    name = filename.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '');
  }
  name = name.replace(/[-_][a-zA-Z0-9]{6,12}[-_]?$/gi, '');

  // Strip emojis and non-alphanumeric chars
  let cleaned = name.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F300}-\u{1F9FF}]|\p{Extended_Pictographic}/gu, '');
  cleaned = cleaned.replace(/\(([0-9]+)\)/g, ''); // strip (1), (2)
  if (!name.toLowerCase().includes('batmobile')) {
    cleaned = cleaned.replace(/\s+2\.0$/i, '');
  }
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
  if (cleaned === 'necklaces' || cleaned === 'necklace' || cleaned === 'pendants' || cleaned === 'pendant') return 'necklace';
  if (cleaned === 'earrings' || cleaned === 'earring') return 'earring';
  if (cleaned === 'bracelets' || cleaned === 'bracelet') return 'bracelet';
  if (cleaned === 'charms' || cleaned === 'charm') return 'charm';
  if (cleaned === 'keychains' || cleaned === 'keychain') return 'keychain';
  if (cleaned === 'brooches' || cleaned === 'brooch') return 'brooch';
  if (cleaned === 'rings' || cleaned === 'ring') return 'ring';
  if (cleaned === 'handmade jewellery' || cleaned === 'handmade' || cleaned === 'handmade_jewellery') return 'handmade jewellery';
  return cleaned;
}

/**
 * Derive appropriate category name from image path or name if product category is missing or generic.
 */
export function deriveCategory(imagePath = '', name = '') {
  const str = (String(imagePath) + ' ' + String(name)).toLowerCase();
  if (str.includes('handmade')) return 'Handmade Jewellery';
  if (str.includes('keychain')) return 'Keychains';
  if (str.includes('earring')) return 'Earrings';
  if (str.includes('ring')) return 'Rings';
  if (str.includes('necklace') || str.includes('pendant')) return 'Pendants';
  if (str.includes('bracelet')) return 'Bracelets';
  if (str.includes('charm')) return 'Charms';
  if (str.includes('brooch')) return 'Brooches';
  if (str.includes('gallery') || str.includes('set')) return 'Jewellery Sets';
  return 'Jewellery';
}

import { STOREFRONT_PRODUCTS } from './product-utils.js';

export function parseNumberValue(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'string') {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? null : parsed;
  }
  if (typeof val === 'object') {
    if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
    if (val.doubleValue !== undefined) return Math.floor(val.doubleValue);
    if (val.stringValue !== undefined) return parseInt(val.stringValue, 10);
  }
  return null;
}

/**
 * Merge storefront product catalog with Firestore inventory snapshot records cleanly without duplicates.
 */
export function combineProducts(firestoreProducts = [], productCostsMap = {}) {
  const result = [];
  const seenIds = new Set();
  const fsMap = {};

  if (Array.isArray(firestoreProducts)) {
    firestoreProducts.forEach(p => {
      const id = p.id || p.productId || getProductId(p.name, p.image);
      fsMap[id] = p;
    });
  }

  STOREFRONT_PRODUCTS.forEach(dp => {
    const pId = getProductId(dp.name, dp.image);
    seenIds.add(pId);

    const fsData = fsMap[pId] || {};
    const rawStock = parseNumberValue(fsData.stock);
    const rawPrice = parseNumberValue(fsData.price);
    const rawCostPrice = parseNumberValue(fsData.costPrice);
    const costFromMap = (productCostsMap && typeof productCostsMap[pId] === 'number') ? productCostsMap[pId] : null;

    const finalStock = (rawStock !== null) ? rawStock : DEFAULT_INITIAL_STOCK;
    const finalPrice = (rawPrice !== null) ? rawPrice : dp.price;
    const finalCostPrice = (rawCostPrice !== null) ? rawCostPrice : costFromMap;
    const fsName = typeof fsData.name === 'object' && fsData.name ? fsData.name.stringValue : fsData.name;
    const fsImage = typeof fsData.image === 'object' && fsData.image ? fsData.image.stringValue : fsData.image;
    const fsCategory = typeof fsData.category === 'object' && fsData.category ? fsData.category.stringValue : fsData.category;
    const finalCategory = fsCategory || dp.category || deriveCategory(dp.image, dp.name);

    result.push({
      id: pId,
      name: fsName || dp.name,
      price: finalPrice,
      costPrice: finalCostPrice,
      category: finalCategory,
      image: fsImage || dp.image,
      stock: finalStock,
      hasFsRecord: Boolean(fsData.id || fsData.productId)
    });
  });

  // Include any extra products found in Firestore that aren't in sourceCatalog
  Object.keys(fsMap).forEach(fsId => {
    if (!seenIds.has(fsId)) {
      const fsData = fsMap[fsId];
      const rawStock = parseNumberValue(fsData.stock);
      const rawPrice = parseNumberValue(fsData.price);
      const rawCostPrice = parseNumberValue(fsData.costPrice);
      const costFromMap = (productCostsMap && typeof productCostsMap[fsId] === 'number') ? productCostsMap[fsId] : null;
      const fsName = typeof fsData.name === 'object' && fsData.name ? fsData.name.stringValue : fsData.name;
      const fsImage = typeof fsData.image === 'object' && fsData.image ? fsData.image.stringValue : fsData.image;
      const fsCategory = typeof fsData.category === 'object' && fsData.category ? fsData.category.stringValue : fsData.category;

      result.push({
        id: fsId,
        name: fsName || fsId,
        price: (rawPrice !== null) ? rawPrice : 0,
        costPrice: (rawCostPrice !== null) ? rawCostPrice : costFromMap,
        category: fsCategory || deriveCategory(fsImage, fsName),
        image: fsImage || '',
        stock: (rawStock !== null) ? rawStock : DEFAULT_INITIAL_STOCK,
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
    return `<span class="stock-badge out-of-stock">Sold Out ❌</span>`;
  }
  if (count === 1) {
    return `<span class="stock-badge low-stock">In Stock (Only 1 left! 🔥)</span>`;
  }
  if (count >= 2 && count <= 5) {
    return `<span class="stock-badge low-stock">In Stock (${count} left)</span>`;
  }
  return `<span class="stock-badge in-stock">In Stock (${count} available)</span>`;
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

