export type View = 'home' | 'shop' | 'builder' | 'guide' | 'checkout' | 'admin';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  popular?: boolean;
}

export interface HamperTier {
  id: string;
  name: string;
  tagline: string;
  price: number;
  maxItems: number;
  popular?: boolean;
  perks: string[];
}

export interface CartItem {
  cartId: string;
  type: 'product' | 'hamper';
  name: string;
  price: number;
  quantity: number;
  image: string;
  hamperItems?: Product[];
  tier?: HamperTier;
}

// ─── Image constants ────────────────────────────────────────────────────────

const IMG = (id: string, w = 400, h = 400) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format`;

// ─── Product catalogue ──────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  // Chocolates & Sweets
  { id: 'c1', name: 'Dark Chocolate Bar', price: 199, category: 'Chocolates', description: 'Rich 70% cacao single-origin dark chocolate.', image: IMG('photo-1599599810769-bcde5a160d32'), popular: true },
  { id: 'c2', name: 'Milk Chocolate Truffles', price: 299, category: 'Chocolates', description: 'Velvety truffle box of 6 handcrafted pieces.', image: IMG('photo-1627647227768-705244233b56'), popular: true },
  { id: 'c3', name: 'Chocolate Bark with Nuts', price: 249, category: 'Chocolates', description: 'Dark chocolate bark with roasted almonds & cranberry.', image: IMG('photo-1606312619070-d48b4c652a52') },
  { id: 'c4', name: 'White Chocolate Fudge', price: 279, category: 'Chocolates', description: 'Creamy white chocolate fudge with vanilla bean.', image: IMG('photo-1599599810769-bcde5a160d32') },
  { id: 'c5', name: 'Artisan Praline Box', price: 399, category: 'Chocolates', description: 'Assorted pralines in a keepsake gift box.', image: IMG('photo-1627647227768-705244233b56') },

  // Candles & Aromatherapy
  { id: 'cn1', name: 'Lavender Soy Candle', price: 349, category: 'Candles', description: 'Hand-poured soy wax with French lavender essential oil.', image: IMG('photo-1643122966676-29e8597257f7'), popular: true },
  { id: 'cn2', name: 'Rose & Geranium Candle', price: 399, category: 'Candles', description: 'Romantic floral blend with natural wax and cotton wick.', image: IMG('photo-1532592068623-db1978e40df5') },
  { id: 'cn3', name: 'Vanilla Comfort Candle', price: 329, category: 'Candles', description: 'Warm vanilla bean scent for cozy evenings.', image: IMG('photo-1636714560735-9f84a7c06d16'), popular: true },
  { id: 'cn4', name: 'Eucalyptus Calm Candle', price: 379, category: 'Candles', description: 'Refreshing eucalyptus & mint for stress relief.', image: IMG('photo-1643122966676-29e8597257f7') },
  { id: 'cn5', name: 'Jasmine Dreams Candle', price: 429, category: 'Candles', description: 'Delicate jasmine blossom for a serene atmosphere.', image: IMG('photo-1532592068623-db1978e40df5') },

  // Skincare & Beauty
  { id: 's1', name: 'Rosewater Face Mist', price: 449, category: 'Skincare', description: 'Pure Bulgarian rosewater for instant hydration.', image: IMG('photo-1556228578-8c89e6adf883'), popular: true },
  { id: 's2', name: 'Shea Butter Hand Cream', price: 299, category: 'Skincare', description: 'Rich hand cream with shea butter and argan oil.', image: IMG('photo-1598440947619-2c35fc9aa908') },
  { id: 's3', name: 'Charcoal Cleansing Bar', price: 249, category: 'Skincare', description: 'Activated charcoal soap for deep pore cleansing.', image: IMG('photo-1556228578-8c89e6adf883') },
  { id: 's4', name: 'Vitamin C Serum', price: 599, category: 'Skincare', description: 'Brightening serum with 15% stabilised Vitamin C.', image: IMG('photo-1598440947619-2c35fc9aa908'), popular: true },
  { id: 's5', name: 'Aloe Vera Gel', price: 199, category: 'Skincare', description: 'Pure aloe vera gel, soothing and multipurpose.', image: IMG('photo-1556228578-8c89e6adf883') },

  // Gourmet Snacks
  { id: 'g1', name: 'Organic Wildflower Honey', price: 349, category: 'Gourmet', description: 'Raw unfiltered honey from Himalayan wildflowers.', image: IMG('photo-1560806887-1e4cd0b6cbd6'), popular: true },
  { id: 'g2', name: 'Infused Olive Oil', price: 399, category: 'Gourmet', description: 'Tuscan extra virgin olive oil with rosemary & garlic.', image: IMG('photo-1560806887-1e4cd0b6cbd6') },
  { id: 'g3', name: 'Gourmet Popcorn Box', price: 199, category: 'Gourmet', description: 'Three flavours: caramel, cheddar and classic salted.', image: IMG('photo-1560806887-1e4cd0b6cbd6') },
  { id: 'g4', name: 'Artisan Herb Crackers', price: 249, category: 'Gourmet', description: 'Hand-baked rosemary and sea salt crackers.', image: IMG('photo-1560806887-1e4cd0b6cbd6') },
  { id: 'g5', name: 'Premium Basmati Tea', price: 279, category: 'Gourmet', description: 'Single-estate Darjeeling first flush in a keepsake tin.', image: IMG('photo-1560806887-1e4cd0b6cbd6'), popular: true },

  // Stationery & Art
  { id: 'st1', name: 'Handmade Paper Journal', price: 349, category: 'Stationery', description: 'Recycled cotton paper journal with hand-stitched binding.', image: IMG('photo-1456735190827-d1262f71b8a3') },
  { id: 'st2', name: 'Calligraphy Pen Set', price: 449, category: 'Stationery', description: 'Classic dip pen with 5 nibs and walnut ink bottle.', image: IMG('photo-1456735190827-d1262f71b8a3') },
  { id: 'st3', name: 'Washi Tape Collection', price: 199, category: 'Stationery', description: 'Set of 6 botanical-printed washi tapes.', image: IMG('photo-1456735190827-d1262f71b8a3') },
  { id: 'st4', name: 'Botanical Bookmarks', price: 149, category: 'Stationery', description: 'Set of 5 hand-illustrated pressed-flower bookmarks.', image: IMG('photo-1456735190827-d1262f71b8a3') },
  { id: 'st5', name: 'Greeting Cards Set', price: 249, category: 'Stationery', description: '6 letterpress greeting cards with envelopes.', image: IMG('photo-1456735190827-d1262f71b8a3'), popular: true },

  // Dry Fruits & Nuts
  { id: 'd1', name: 'Premium Cashews (200g)', price: 349, category: 'Dry Fruits', description: 'Whole W180 grade cashews, lightly salted.', image: IMG('photo-1599940778173-e276d4acb2bb'), popular: true },
  { id: 'd2', name: 'Almond & Raisin Mix', price: 299, category: 'Dry Fruits', description: 'California almonds with Afghani golden raisins.', image: IMG('photo-1599940778173-e276d4acb2bb') },
  { id: 'd3', name: 'Medjool Dates Box', price: 399, category: 'Dry Fruits', description: 'Soft and luscious jumbo Medjool dates.', image: IMG('photo-1599940778173-e276d4acb2bb') },
  { id: 'd4', name: 'Pistachio Pack (150g)', price: 449, category: 'Dry Fruits', description: 'Roasted and salted Iranian pistachios.', image: IMG('photo-1599940778173-e276d4acb2bb') },
  { id: 'd5', name: 'Mixed Berry Trail Mix', price: 279, category: 'Dry Fruits', description: 'Cranberries, blueberries, goji with cashews & almonds.', image: IMG('photo-1599940778173-e276d4acb2bb'), popular: true },
];

export const CATEGORIES = [
  { name: 'Chocolates', emoji: '🍫', description: 'Handcrafted artisan chocolates', image: IMG('photo-1599599810769-bcde5a160d32', 600, 600) },
  { name: 'Candles', emoji: '🕯️', description: 'Hand-poured aromatic candles', image: IMG('photo-1643122966676-29e8597257f7', 600, 600) },
  { name: 'Skincare', emoji: '🌿', description: 'Natural beauty & skincare', image: IMG('photo-1556228578-8c89e6adf883', 600, 600) },
  { name: 'Gourmet', emoji: '🍯', description: 'Artisan gourmet delights', image: IMG('photo-1560806887-1e4cd0b6cbd6', 600, 600) },
  { name: 'Stationery', emoji: '📓', description: 'Handmade paper & stationery', image: IMG('photo-1456735190827-d1262f71b8a3', 600, 600) },
  { name: 'Dry Fruits', emoji: '🥜', description: 'Premium nuts & dry fruits', image: IMG('photo-1599940778173-e276d4acb2bb', 600, 600) },
];

export const HAMPER_TIERS: HamperTier[] = [
  {
    id: 'petite',
    name: 'Petite',
    tagline: 'A thoughtful little surprise',
    price: 999,
    maxItems: 3,
    perks: ['3 curated items', 'Kraft gift box', 'Handwritten card'],
  },
  {
    id: 'classic',
    name: 'Classic',
    tagline: 'The perfect gift for any occasion',
    price: 1499,
    maxItems: 5,
    perks: ['5 curated items', 'Premium gift box', 'Satin ribbon & card', 'Tissue paper wrap'],
  },
  {
    id: 'deluxe',
    name: 'Deluxe',
    tagline: 'An indulgent curated experience',
    price: 2499,
    maxItems: 8,
    popular: true,
    perks: ['8 curated items', 'Wooden crate box', 'Satin ribbon & card', 'Tissue & shredded paper', 'Free delivery'],
  },
  {
    id: 'grand',
    name: 'Grand',
    tagline: 'The ultimate luxury hamper',
    price: 3999,
    maxItems: 12,
    perks: ['12 curated items', 'Luxury keepsake box', 'Wax seal & premium ribbon', 'Full interior styling', 'Free priority delivery', 'Personalised note'],
  },
];

export const POPULAR_PRODUCTS = PRODUCTS.filter(p => p.popular).slice(0, 6);

export const HERO_IMAGE = `https://images.unsplash.com/photo-1773450970959-cef81e9b1053?w=1400&h=900&fit=crop&auto=format`;
export const BUILDER_IMAGE = `https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=700&fit=crop&auto=format`;
