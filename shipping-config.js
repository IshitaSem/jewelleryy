/**
 * Official India Post Parcel Retail Tariff Configuration (w.e.f. 01.08.2026, inclusive of GST)
 * Single source of truth for domestic weight-based shipping calculations.
 */

// 1. Configurable Packaging Weight in Grams
export const PACKAGING_WEIGHT_GRAMS = 20;

// 2. Shipping Service Name
export const SHIPPING_SERVICE_NAME = "India Post Parcel Retail";

// 3. Default Item Weights per Category (in Grams)
export const DEFAULT_CATEGORY_WEIGHTS = {
  Earrings: 15,
  Necklaces: 25,
  Bracelets: 20,
  Charms: 15,
  Brooches: 20,
  Default: 20
};

// 4. Official India Post Parcel Retail Rate Matrix (Effective 01.08.2026, inclusive of GST)
// Slabs based on maximum weight limit in grams
export const INDIA_POST_PARCEL_RATES = [
  { maxWeight: 500,   local: 34, withinState: 77,  zoneMetro: 82,   otherStates: 90 },
  { maxWeight: 1000,  local: 56, withinState: 107, zoneMetro: 126,  otherStates: 134 },
  { maxWeight: 1500,  local: 70, withinState: 139, zoneMetro: 168,  otherStates: 201 },
  { maxWeight: 2000,  local: 103, withinState: 188, zoneMetro: 234,  otherStates: 283 },
  { maxWeight: 3000,  local: 136, withinState: 259, zoneMetro: 327,  otherStates: 397 },
  { maxWeight: 4000,  local: 171, withinState: 316, zoneMetro: 406,  otherStates: 496 },
  { maxWeight: 5000,  local: 206, withinState: 382, zoneMetro: 496,  otherStates: 607 },
  { maxWeight: 6000,  local: 240, withinState: 442, zoneMetro: 578,  otherStates: 713 },
  { maxWeight: 7000,  local: 276, withinState: 500, zoneMetro: 600,  otherStates: 821 },
  { maxWeight: 8000,  local: 312, withinState: 560, zoneMetro: 744,  otherStates: 927 },
  { maxWeight: 9000,  local: 346, withinState: 618, zoneMetro: 826,  otherStates: 1033 },
  { maxWeight: 10000, local: 382, withinState: 678, zoneMetro: 908,  otherStates: 1139 }
];

/**
 * Determine shipping rate zone based on customer state/city.
 * Store home state is assumed as Uttarakhand / Delhi.
 */
export function getDestinationZone(state, city) {
  if (!state) return 'otherStates';
  const cleanState = state.trim().toLowerCase();
  
  // Example home state check: Uttarakhand or Delhi
  const homeStates = ['uttarakhand', 'uk', 'delhi', 'new delhi', 'ncr'];
  if (homeStates.includes(cleanState)) {
    return 'withinState';
  }
  return 'otherStates';
}

/**
 * Calculate reusable shipping charge based on parcel weight in grams and customer destination.
 * Uses integer math to prevent floating point slab errors.
 */
export function calculateShipping(totalWeightInGrams, state = '', city = '') {
  // Safe integer rounding for weight
  const weight = Math.ceil(Number(totalWeightInGrams) || 0);
  if (weight <= 0) return 0;

  const zoneKey = getDestinationZone(state, city);
  let fee = 0;

  // Find exact slab from tariff matrix
  for (const slab of INDIA_POST_PARCEL_RATES) {
    if (weight <= slab.maxWeight) {
      fee = slab[zoneKey] || slab.otherStates;
      break;
    }
  }

  if (fee === 0) {
    // Fallback for parcels > 10kg (extrapolate highest slab rate)
    const highestSlab = INDIA_POST_PARCEL_RATES[INDIA_POST_PARCEL_RATES.length - 1];
    const extraWeight = weight - highestSlab.maxWeight;
    const extraSlabs = Math.ceil(extraWeight / 1000);
    const baseRate = highestSlab[zoneKey] || highestSlab.otherStates;
    fee = baseRate + (extraSlabs * 100);
  }

  // Explicit rounding logic: if shipping fee is 84, round up to 90
  if (fee === 84) {
    fee = 90;
  }

  return fee;
}

/**
 * Retrieve weight in grams for a given item or product image/name.
 */
export function getItemWeight(item) {
  if (!item) return DEFAULT_CATEGORY_WEIGHTS.Default;
  if (typeof item.weight === 'number' && item.weight > 0) {
    return item.weight;
  }
  
  const name = item.name || '';
  const image = item.image || '';

  if (/earring/i.test(name) || /earrings/i.test(image)) return DEFAULT_CATEGORY_WEIGHTS.Earrings;
  if (/necklace/i.test(name) || /necklaces/i.test(image)) return DEFAULT_CATEGORY_WEIGHTS.Necklaces;
  if (/bracelet/i.test(name) || /bracelet/i.test(image)) return DEFAULT_CATEGORY_WEIGHTS.Bracelets;
  if (/charm/i.test(name) || /charms/i.test(image)) return DEFAULT_CATEGORY_WEIGHTS.Charms;
  if (/brooch/i.test(name) || /brooches/i.test(image)) return DEFAULT_CATEGORY_WEIGHTS.Brooches;

  return DEFAULT_CATEGORY_WEIGHTS.Default;
}

if (typeof window !== 'undefined') {
  window.PACKAGING_WEIGHT_GRAMS = PACKAGING_WEIGHT_GRAMS;
  window.SHIPPING_SERVICE_NAME = SHIPPING_SERVICE_NAME;
  window.calculateShipping = calculateShipping;
  window.getItemWeight = getItemWeight;
}
