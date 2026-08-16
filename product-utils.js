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

/**
 * Single source of truth for the storefront jewellery product catalog.
 */
export const STOREFRONT_PRODUCTS = [
  // EARRINGS (15)
  { name: 'Butterfly Bloom', price: 69, image: 'images/earrings/Butterfly Bloom 🦋.jpg', category: 'Earrings' },
  { name: 'Cherry Heart Star', price: 99, image: 'images/earrings/Cherry Heart star🍒.jpg', category: 'Earrings' },
  { name: 'Silver Drops', price: 99, image: 'images/earrings/Silver Drops ✨.jpg', category: 'Earrings' },
  { name: 'Black Moon Dagly', price: 179, image: 'images/earrings/black moon dagly.JPG', category: 'Earrings' },
  { name: 'Feather Heartkey', price: 59, image: 'images/earrings/feather heartkey.jpg', category: 'Earrings' },
  { name: 'Pink Bowiee', price: 179, image: 'images/earrings/pink bowiee.JPG', category: 'Earrings' },
  { name: 'Pink Lily Crystal Garden', price: 119, image: 'images/earrings/pink lily Crystal Garden ✨.jpg', category: 'Earrings' },
  { name: 'Pink Love Heart', price: 79, image: 'images/earrings/pink love heart.jpg', category: 'Earrings' },
  { name: 'Pink Moon Dangly', price: 179, image: 'images/earrings/pink moon dangly (1).jpg', category: 'Earrings' },
  { name: 'Pink Tulip', price: 99, image: 'images/earrings/pink tulip.jpg', category: 'Earrings' },
  { name: 'Purple Love Heart', price: 79, image: 'images/earrings/purple love heart.jpg', category: 'Earrings' },
  { name: 'Red Bling Star', price: 169, image: 'images/earrings/red bling star.jpg', category: 'Earrings' },
  { name: 'Red Donut Hoop', price: 49, image: 'images/earrings/red donut hoop.jpg', category: 'Earrings' },
  { name: 'Redhearty Bow', price: 169, image: 'images/earrings/redhearty bow.jpg', category: 'Earrings' },
  { name: 'Silver Bowy', price: 179, image: 'images/earrings/silver bowy (1).jpg', category: 'Earrings' },

  // PENDANTS (30)
  { name: 'Celi Novia', price: 400, image: 'images/necklaces/Celi✧Novia (1).jpeg', category: 'Pendants' },
  { name: 'Pink Hearty Cross', price: 250, image: 'images/necklaces/pink hearty cross.jpg', category: 'Pendants' },
  { name: 'Red Gem Bling', price: 250, image: 'images/necklaces/red gem bling.jpg', category: 'Pendants' },
  { name: 'Sun Nd Moon', price: 299, image: 'images/necklaces/sun nd moon.JPG', category: 'Pendants' },
  { name: 'Y2K White Cross', price: 250, image: 'images/necklaces/Y2K white cross.JPG', category: 'Pendants' },
  { name: 'Baddie Heartycross', price: 300, image: 'images/necklaces/baddie heartycross.JPG', category: 'Pendants' },
  { name: 'Blackgothic Cross', price: 250, image: 'images/necklaces/blackgothic cross (1).jpg', category: 'Pendants' },
  { name: 'Bling', price: 200, image: 'images/necklaces/bling.JPG', category: 'Pendants' },
  { name: 'Bludysword', price: 100, image: 'images/necklaces/bludysword (1).jpg', category: 'Pendants' },
  { name: 'Bowie', price: 200, image: 'images/necklaces/bowie.JPG', category: 'Pendants' },
  { name: 'Box Cross', price: 250, image: 'images/necklaces/box cross.JPG', category: 'Pendants' },
  { name: 'Chromeish', price: 250, image: 'images/necklaces/chromeish.JPG', category: 'Pendants' },
  { name: 'Crosssilver', price: 250, image: 'images/necklaces/crosssilver.JPG', category: 'Pendants' },
  { name: 'Gothic Black Cromeheart', price: 300, image: 'images/necklaces/gothic black cromeheart (1).jpg', category: 'Pendants' },
  { name: 'Gothic Red Moonie', price: 200, image: 'images/necklaces/gothic red moonie (1).jpg', category: 'Pendants' },
  { name: 'Heart Pearl', price: 200, image: 'images/necklaces/heart pearl.JPG', category: 'Pendants' },
  { name: 'Hollowhearty', price: 200, image: 'images/necklaces/hollowhearty.JPG', category: 'Pendants' },
  { name: 'Knotty Crossy', price: 250, image: 'images/necklaces/knotty crossy (1).jpg', category: 'Pendants' },
  { name: 'Long Blackgothic', price: 300, image: 'images/necklaces/long blackgothic (1).jpg', category: 'Pendants' },
  { name: 'Meltin Hearty', price: 250, image: 'images/necklaces/meltin hearty (1).jpg', category: 'Pendants' },
  { name: 'Moonie', price: 250, image: 'images/necklaces/moonie.JPG', category: 'Pendants' },
  { name: 'Oval Open Heart Long', price: 300, image: 'images/necklaces/oval open heart long.JPG', category: 'Pendants' },
  { name: 'Red Gem Cross Ross', price: 250, image: 'images/necklaces/red gem cross ross (1).jpg', category: 'Pendants' },
  { name: 'Red Heart Pearl', price: 180, image: 'images/necklaces/red heart pearl.jpg', category: 'Pendants' },
  { name: 'RedCromie', price: 200, image: 'images/necklaces/redCromie (1).jpg', category: 'Pendants' },
  { name: 'Redsil Chromee Heart', price: 190, image: 'images/necklaces/redsil chromee heart.JPG', category: 'Pendants' },
  { name: 'Sneakerpendant', price: 200, image: 'images/necklaces/sneakerpendant.jpg', category: 'Pendants' },
  { name: 'Sneaky knot Hearty', price: 250, image: 'images/necklaces/sneaky hearty.JPG', category: 'Pendants' },
  { name: 'Spiral Star', price: 200, image: 'images/necklaces/spiral star.JPG', category: 'Pendants' },
  { name: 'Starsy', price: 250, image: 'images/necklaces/starsy.JPG', category: 'Pendants' },

  // BRACELETS (1)
  { name: 'Bestie Bnw', price: 180, image: 'images/Bracelet/bestie bnw (1).jpg', category: 'Bracelets' },

  // CHARMS (9)
  { name: 'Blue Bow', price: 120, image: 'images/charms/blue bow.jpg', category: 'Charms' },
  { name: 'Cherry', price: 99, image: 'images/charms/cherry (1).jpg', category: 'Charms' },
  { name: 'Greenie Bowie', price: 120, image: 'images/charms/greenie bowie.jpg', category: 'Charms' },
  { name: 'Katil Billi', price: 120, image: 'images/charms/katil billi (1).jpg', category: 'Charms' },
  { name: 'Pearly Bow', price: 120, image: 'images/charms/pearly bow.jpg', category: 'Charms' },
  { name: 'Pink Bowie', price: 120, image: 'images/charms/pink bowie.jpg', category: 'Charms' },
  { name: 'Pink Clover Dangle', price: 110, image: 'images/charms/pink clover dangle.jpg', category: 'Charms' },
  { name: 'Pink Missi', price: 150, image: 'images/charms/pink missi (1).jpg', category: 'Charms' },
  { name: 'Purple Bowie', price: 120, image: 'images/charms/purple bowie.jpg', category: 'Charms' },

  // BROOCHES (3)
  { name: 'Danglecrystal', price: 250, image: 'images/Brooches/danglecrystal.JPG', category: 'Brooches' },
  { name: 'Fetherz', price: 250, image: 'images/Brooches/fetherz.JPG', category: 'Brooches' },
  { name: 'Merima', price: 250, image: 'images/Brooches/merima.JPG', category: 'Brooches' },

  // JEWELLERY SETS (3)
  { name: 'Custom Jar Set', price: 420, image: 'images/gallery/gallery (1).jpg', category: 'Jewellery Sets' },
  { name: 'Vintage Jewellery Jar Set', price: 420, image: 'images/gallery/gallery (2).jpg', category: 'Jewellery Sets' },
  { name: 'Y2K Mystery Jar Set', price: 400, image: 'images/gallery/gallery (3).jpg', category: 'Jewellery Sets' }
];

if (typeof window !== 'undefined') {
  window.getProductNameFromImage = getProductNameFromImage;
  window.STOREFRONT_PRODUCTS = STOREFRONT_PRODUCTS;
}

