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
  window.renderStockBadge = renderStockBadge;
  window.DEFAULT_INITIAL_STOCK = DEFAULT_INITIAL_STOCK;
}
