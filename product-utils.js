/**
 * Utility function to derive human-readable product names from image paths across all categories.
 * The image filename is the single source of truth for product titles.
 */
export function getProductNameFromImage(imagePath) {
  if (!imagePath) return '';
  
  // 1. Extract filename from path
  let filename = imagePath.split('/').pop().split('\\').pop();
  try {
    filename = decodeURIComponent(filename);
  } catch (e) {}

  // 2. Remove file extension
  let nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '');

  // 3. Strip decorative emojis for clean title case string
  let cleanStr = nameWithoutExt.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // 4. Base product name grouping rules
  let baseName = cleanStr;

  if (/^n[0-9]+$/i.test(baseName)) {
    // N1.jpeg, N2.jpeg, N3.jpeg -> "N"
    baseName = 'N';
  } else if (/^earring\s*\(([0-9]+)\)$/i.test(baseName)) {
    const num = baseName.match(/([0-9]+)/)[1];
    baseName = `Earring ${num}`;
  } else if (/^charm\s*\(([0-9]+)\)$/i.test(baseName)) {
    const num = baseName.match(/([0-9]+)/)[1];
    baseName = `Charm ${num}`;
  } else if (/^bracelet\s*\(([0-9]+)\)$/i.test(baseName)) {
    baseName = `Bracelet`;
  } else if (/^neck\s*\(([0-9]+)\)$/i.test(baseName)) {
    const num = baseName.match(/([0-9]+)/)[1];
    baseName = `Neck ${num}`;
  } else {
    // Remove multi-angle indices like (1), (2), (3) or 2.0
    baseName = baseName.replace(/\s*\(([0-9]+)\)/g, '');
    baseName = baseName.replace(/\s+2\.0$/i, '');
  }

  // 5. Replace hyphens and underscores with spaces
  baseName = baseName.replace(/[-_]+/g, ' ');

  // 6. Clean unnecessary repeated spaces
  baseName = baseName.replace(/\s+/g, ' ').trim();

  // 7. Format into clean Title Case while preserving special identifiers
  return baseName.split(' ').map(word => {
    if (!word) return '';
    if (/^\d+(\.\d+)?$/.test(word)) return word;
    if (word.toUpperCase() === 'Y2K') return 'Y2K';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

if (typeof window !== 'undefined') {
  window.getProductNameFromImage = getProductNameFromImage;
}
