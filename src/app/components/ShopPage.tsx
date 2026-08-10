import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { SlidersHorizontal } from 'lucide-react';
import { PRODUCTS, CATEGORIES } from '../data';
import type { CartItem } from '../data';

interface ShopPageProps {
  addToCart: (item: CartItem) => void;
  setCartOpen: (o: boolean) => void;
}

export function ShopPage({ addToCart, setCartOpen }: ShopPageProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [added, setAdded] = useState<string | null>(null);

  const categories = ['All', ...CATEGORIES.map(c => c.name)];

  const filtered = useMemo(() => {
    let list = activeCategory === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [activeCategory, sortBy]);

  const handleAdd = (product: typeof PRODUCTS[0]) => {
    addToCart({
      cartId: `${product.id}-${Date.now()}`,
      type: 'product',
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    setAdded(product.id);
    setCartOpen(true);
    setTimeout(() => setAdded(null), 1800);
  };

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ background: '#FDFAF5' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Page header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: '#9B6B3C' }}>
            Our collection
          </p>
          <h1
            className="font-normal"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', color: '#1A1008' }}
          >
            Shop all gifts
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#8B7355' }}>
            {filtered.length} products · hand-picked, carefully packaged
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200"
                style={{
                  background: activeCategory === cat ? '#9B6B3C' : '#FFFFFF',
                  color: activeCategory === cat ? '#FFFFFF' : '#9B6B3C',
                  border: '1.5px solid',
                  borderColor: activeCategory === cat ? '#9B6B3C' : '#EAD9C4',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} style={{ color: '#8B7355' }} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs font-medium border rounded-full px-3 py-2 appearance-none"
              style={{
                background: '#FFFFFF',
                color: '#5C4A36',
                borderColor: '#EAD9C4',
                outline: 'none',
              }}
            >
              <option value="default">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              className="group rounded-xl overflow-hidden bg-white flex flex-col"
              style={{ border: '1px solid #EAD9C4' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -4, boxShadow: '0 12px 36px rgba(155,107,60,0.1)' }}
            >
              {/* Image */}
              <div className="relative overflow-hidden aspect-square" style={{ background: '#F5EAD8' }}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {product.popular && (
                  <div
                    className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#D4A96A', color: '#1A1008' }}
                  >
                    Popular
                  </div>
                )}
              </div>

              <div className="p-3 flex flex-col flex-1">
                <p className="text-[10px] mb-0.5 font-medium uppercase tracking-wide" style={{ color: '#B0906E' }}>
                  {product.category}
                </p>
                <h3 className="text-xs font-semibold leading-snug flex-1 mb-2" style={{ color: '#1A1008' }}>
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: '#9B6B3C' }}>₹{product.price}</span>
                  <motion.button
                    onClick={() => handleAdd(product)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: added === product.id ? '#3E6B4F' : '#F5EAD8',
                      color: added === product.id ? '#FFFFFF' : '#9B6B3C',
                    }}
                    whileTap={{ scale: 0.93 }}
                  >
                    {added === product.id ? '✓ Added' : '+ Add'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
