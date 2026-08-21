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

  // Remove Vite production asset hashes (e.g. "-I0ko5PP-" or "-C7AtFafs")
  filename = filename.replace(/[-_][a-zA-Z0-9]{6,12}[-_]?(?=\.\w+$|$)/gi, '');

  // 2. Remove file extension
  let nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '');
  nameWithoutExt = nameWithoutExt.replace(/[-_][a-zA-Z0-9]{6,12}[-_]?$/gi, '');

  // 3. Strip decorative emojis and special symbols for clean title case string
  let cleanStr = nameWithoutExt.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F300}-\u{1F9FF}]|\p{Extended_Pictographic}/gu, ' ');
  cleanStr = cleanStr.replace(/[✧]/g, ' ');

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
    if (!baseName.toLowerCase().includes('batmobile')) {
      baseName = baseName.replace(/\s+[0-9]\.0$/i, '');
    }
  }

  // 5. Replace hyphens and underscores with spaces
  baseName = baseName.replace(/[-_]+/g, ' ');

  // 6. Clean unnecessary repeated spaces
  baseName = baseName.replace(/\s+/g, ' ').trim();

  let formatted = baseName.split(' ').map(word => {
    if (!word) return '';
    if (/^\d+(\.\d+)?$/.test(word)) return word;
    if (word.toUpperCase() === 'Y2K') return 'Y2K';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');

  if (imagePath && imagePath.toLowerCase().includes('keychain') && !formatted.toLowerCase().includes('keychain')) {
    formatted = `${formatted} Keychain`;
  }
  return formatted;
}

/**
 * Single source of truth for the storefront jewellery product catalog.
 */
export const STOREFRONT_PRODUCTS = [
  // KEYCHAINS (4)
  { name: 'Batmobile 1.0 Keychain', price: 199, image: 'images/keychains/batmobile 1.0.png', category: 'Keychains' },
  { name: 'Batmobile 2.0 Keychain', price: 199, image: 'images/keychains/batmobile 2.0.png', category: 'Keychains' },
  { name: 'Batmobile 3.0 Keychain', price: 199, image: 'images/keychains/batmobile 3.0.png', category: 'Keychains' },
  { name: 'Batmobile 4.0 Keychain', price: 199, image: 'images/keychains/batmobile 4.0.png', category: 'Keychains' },
  // EARRINGS (15)
  { name: 'Butterfly Bloom', price: 69, image: 'images/earrings/Butterfly Bloom 🦋.jpg', category: 'Earrings' },
  { name: 'Cherry Heart Star', price: 99, image: 'images/earrings/Cherry Heart star🍒.jpg', category: 'Earrings' },
  { name: 'Silver Drops', price: 99, image: 'images/earrings/Silver Drops ✨.jpg', category: 'Earrings' },
  { name: 'Black Moon Dagly', price: 179, image: 'images/earrings/black moon dagly.JPG', category: 'Earrings' },
  { name: 'Feather Heartkey', price: 59, image: 'images/earrings/feather heartkey.jpg', category: 'Earrings' },
  { name: 'Pink Bowiee', price: 179, image: 'images/earrings/pink bowiee.JPG', category: 'Earrings' },
  { name: 'Pink Lily Crystal Garden', price: 50, image: 'images/earrings/pink lily Crystal Garden ✨.jpg', category: 'Earrings' },
  { name: 'Pink Love Heart', price: 79, image: 'images/earrings/pink love heart.jpg', category: 'Earrings' },
  { name: 'Pink Moon Dangly', price: 179, image: 'images/earrings/pink moon dangly (1).jpg', category: 'Earrings' },
  { name: 'Pink Tulip', price: 60, image: 'images/earrings/pink tulip.jpg', category: 'Earrings' },
  { name: 'Purple Love Heart', price: 79, image: 'images/earrings/purple love heart.jpg', category: 'Earrings' },
  { name: 'Red Bling Star', price: 169, image: 'images/earrings/red bling star.jpg', category: 'Earrings' },
  { name: 'Red Donut Hoop', price: 49, image: 'images/earrings/red donut hoop.jpg', category: 'Earrings' },
  { name: 'Redhearty Bow', price: 169, image: 'images/earrings/redhearty bow.jpg', category: 'Earrings' },
  { name: 'Silver Bowy', price: 179, image: 'images/earrings/silver bowy (1).jpg', category: 'Earrings' },

  // PENDANTS (31)
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
  { name: 'Cyber Cross', price: 250, image: 'images/necklaces/Cyber Cross (1).png', category: 'Pendants' },
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

  // BRACELETS (2)
  { name: 'Bestie Bnw', price: 180, image: 'images/Bracelet/bestie bnw (1).jpg', category: 'Bracelets' },
  { name: 'Car Guys Italian Charm Bracelet', price: 215, image: 'images/Bracelet/itelian bracelets.png', category: 'Bracelets', options: ['BMW', 'Volkswagen', 'Porsche'] },

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

  // BROOCHES (4)
  { name: 'Danglecrystal', price: 250, image: 'images/Brooches/danglecrystal.JPG', category: 'Brooches' },
  { name: 'Fetherz', price: 250, image: 'images/Brooches/fetherz.JPG', category: 'Brooches' },
  { name: 'Merima', price: 250, image: 'images/Brooches/merima.JPG', category: 'Brooches' },
  { name: 'Pinnima', price: 250, image: 'images/Brooches/pinnima.JPG', category: 'Brooches' },

  // RINGS (11)
  { name: 'Bloodclutch', price: 199, image: 'images/rings/Bloodclutch.png', category: 'Rings' },
  { name: 'Ember Throne', price: 249, image: 'images/rings/Ember throne (1).png', category: 'Rings' },
  { name: 'Heartslash', price: 199, image: 'images/rings/Heartslash.png', category: 'Rings' },
  { name: 'Iron Cromecrest', price: 249, image: 'images/rings/Iron Cromecrest.png', category: 'Rings' },
  { name: 'Nightspire', price: 220, image: 'images/rings/Nightspire.png', category: 'Rings' },
  { name: 'Novamelt', price: 199, image: 'images/rings/Novamelt.png', category: 'Rings' },
  { name: 'Queendrip', price: 199, image: 'images/rings/Queendrip.png', category: 'Rings' },
  { name: 'Starscar', price: 199, image: 'images/rings/Starscar.png', category: 'Rings' },
  { name: 'Venomfang', price: 220, image: 'images/rings/Venomfang.png', category: 'Rings' },
  { name: 'Batman Ring', price: 199, image: 'images/rings/batman.png', category: 'Rings' },
  { name: 'Dear Couple Ring', price: 299, image: 'images/rings/dear couple ring (1).png', category: 'Rings' },

  // HANDMADE JEWELLERY (2)
  { name: 'Celi Novia', price: 400, image: 'images/Handmade jewellery/Celi✧Novia (1).jpeg', category: 'Handmade Jewellery' },
  { name: 'Gothic Black Cromeheart', price: 300, image: 'images/Handmade jewellery/gothic black cromeheart (1).jpg', category: 'Handmade Jewellery' }
];

export function isEligibleRing(item, ruleConfig = null) {
  const targetBasePrice = ruleConfig?.basePrice || 150;
  const itemPrice = typeof item.originalPrice === 'number' ? item.originalPrice : item.price;
  if (itemPrice !== targetBasePrice) return false;
  
  let itemCat = (item.category || '').toLowerCase();
  
  if (!itemCat) {
    const rawName = String(item.name || '').split('(')[0].trim().toLowerCase();
    const catalog = (typeof window !== 'undefined' && window.STOREFRONT_PRODUCTS) ? window.STOREFRONT_PRODUCTS : (STOREFRONT_PRODUCTS || []);
    const match = catalog.find(p => {
      const pName = String(p.name || '').toLowerCase();
      return pName === rawName || rawName.includes(pName) || pName.includes(rawName);
    });
    if (match && match.category) {
      itemCat = String(match.category).toLowerCase();
    }
  }

  if (!itemCat) {
    const imgAndName = ((item.image || '') + ' ' + (item.name || '')).toLowerCase();
    if (imgAndName.includes('earring')) return false;
    if (imgAndName.includes('necklace') || imgAndName.includes('pendant') || imgAndName.includes('bracelet') || imgAndName.includes('charm') || imgAndName.includes('brooch')) return false;
    if (imgAndName.includes('/rings/') || imgAndName.includes('ring')) itemCat = 'rings';
  }

  if (itemCat.includes('earring')) return false;
  if (itemCat.includes('ring')) return true;

  return false;
}




export function calculateRingBundleDiscount(cartItems = [], ruleConfig = null) {
  if (ruleConfig && ruleConfig.enabled === false) {
    return { bundleDiscount: 0, totalEligibleQty: 0, appliedTierPrice: 150, basePrice: 150, eligibleItems: [] };
  }

  const defaultTiers = [
    { minQuantity: 1, pricePerItem: 150 },
    { minQuantity: 2, pricePerItem: 130 },
    { minQuantity: 3, pricePerItem: 110 }
  ];

  const tiers = (ruleConfig && Array.isArray(ruleConfig.tiers) && ruleConfig.tiers.length > 0)
    ? ruleConfig.tiers
    : defaultTiers;

  const eligibleItems = [];
  let totalEligibleQty = 0;

  cartItems.forEach(item => {
    if (isEligibleRing(item, ruleConfig)) {
      eligibleItems.push(item);
      totalEligibleQty += (item.quantity || 1);
    }
  });

  if (totalEligibleQty === 0) {
    return { bundleDiscount: 0, totalEligibleQty: 0, appliedTierPrice: 150, basePrice: 150, eligibleItems: [] };
  }

  const sortedTiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  let appliedTierPrice = 150;
  for (const tier of sortedTiers) {
    if (totalEligibleQty >= tier.minQuantity) {
      appliedTierPrice = tier.pricePerItem;
      break;
    }
  }

  const basePrice = ruleConfig?.basePrice || 150;
  const bundleDiscount = Math.max(0, (basePrice - appliedTierPrice) * totalEligibleQty);

  return {
    bundleDiscount,
    totalEligibleQty,
    appliedTierPrice,
    basePrice,
    eligibleItems
  };
}

export function calculateCouponDiscount(coupon, subtotalAfterBundle) {
  if (!coupon || !coupon.code || coupon.active === false) {
    return { valid: false, discount: 0, reason: "Coupon is inactive or invalid." };
  }

  const now = new Date();
  if (coupon.startDate) {
    const start = new Date(coupon.startDate);
    if (!isNaN(start.getTime()) && now < start) {
      return { valid: false, discount: 0, reason: "Coupon promotion has not started yet." };
    }
  }

  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate);
    if (!isNaN(expiry.getTime()) && now > expiry) {
      return { valid: false, discount: 0, reason: "Coupon code has expired." };
    }
  }

  const minOrder = Number(coupon.minimumOrder) || 0;
  if (subtotalAfterBundle < minOrder) {
    return { valid: false, discount: 0, reason: `Minimum order value of ₹${minOrder} required for this coupon.` };
  }

  if (typeof coupon.usageLimit === 'number' && coupon.usageLimit > 0) {
    const usageCount = Number(coupon.usageCount) || 0;
    if (usageCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, reason: "Coupon usage limit has been reached." };
    }
  }

  let discount = 0;
  const val = Number(coupon.discountValue) || 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((subtotalAfterBundle * val) / 100);
    const maxDiscount = Number(coupon.maximumDiscount) || 0;
    if (maxDiscount > 0 && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else if (coupon.discountType === 'fixed') {
    discount = val;
  }

  discount = Math.min(discount, subtotalAfterBundle);
  discount = Math.max(0, discount);

  return {
    valid: true,
    discount,
    code: coupon.code,
    reason: ""
  };
}

if (typeof window !== 'undefined') {
  window.getProductNameFromImage = getProductNameFromImage;
  window.STOREFRONT_PRODUCTS = STOREFRONT_PRODUCTS;
  window.isEligibleRing = isEligibleRing;
  window.calculateRingBundleDiscount = calculateRingBundleDiscount;
  window.calculateCouponDiscount = calculateCouponDiscount;
}



