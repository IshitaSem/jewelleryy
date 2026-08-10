import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, Minus, ShoppingBag, ChevronLeft, Info } from 'lucide-react';
import { PRODUCTS, CATEGORIES, HAMPER_TIERS } from '../data';
import type { HamperTier, Product, CartItem } from '../data';

interface HamperBuilderPageProps {
  addToCart: (item: CartItem) => void;
  setCartOpen: (o: boolean) => void;
}

export function HamperBuilderPage({ addToCart, setCartOpen }: HamperBuilderPageProps) {
  const [selectedTier, setSelectedTier] = useState<HamperTier | null>(null);
  const [selectedItems, setSelectedItems] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [added, setAdded] = useState(false);

  const categories = ['All', ...CATEGORIES.map(c => c.name)];

  const filtered = useMemo(() =>
    activeCategory === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory),
    [activeCategory]
  );

  const isSelected = (id: string) => selectedItems.some(p => p.id === id);
  const canAdd = selectedTier ? selectedItems.length < selectedTier.maxItems : false;
  const progress = selectedTier ? (selectedItems.length / selectedTier.maxItems) * 100 : 0;
  const total = (selectedTier?.price ?? 0);

  const toggleItem = (product: Product) => {
    if (!selectedTier) return;
    if (isSelected(product.id)) {
      setSelectedItems(prev => prev.filter(p => p.id !== product.id));
    } else if (canAdd) {
      setSelectedItems(prev => [...prev, product]);
    }
  };

  const handleAddToCart = () => {
    if (!selectedTier || selectedItems.length === 0) return;
    addToCart({
      cartId: `hamper-${Date.now()}`,
      type: 'hamper',
      name: `${selectedTier.name} Hamper`,
      price: selectedTier.price,
      quantity: 1,
      image: selectedItems[0].image,
      hamperItems: selectedItems,
      tier: selectedTier,
    });
    setAdded(true);
    setCartOpen(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (!selectedTier) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-6 md:px-10" style={{ background: '#FDFAF5' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: '#9B6B3C' }}>
              Step 1 of 2
            </p>
            <h1
              className="font-normal mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 5vw, 3.2rem)', color: '#1A1008' }}
            >
              Choose your hamper size
            </h1>
            <p className="text-sm max-w-md mx-auto" style={{ color: '#8B7355' }}>
              Every tier includes premium packaging, a handwritten card, and beautiful presentation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {HAMPER_TIERS.map((tier, i) => (
              <motion.button
                key={tier.id}
                onClick={() => setSelectedTier(tier)}
                className="relative text-left rounded-2xl p-6 flex flex-col transition-all duration-200"
                style={{
                  background: tier.popular ? '#2D1B0E' : '#FFFFFF',
                  border: tier.popular ? 'none' : '1.5px solid #EAD9C4',
                }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(26,16,8,0.12)' }}
              >
                {tier.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ background: '#D4A96A', color: '#1A1008' }}
                  >
                    Most Popular
                  </div>
                )}
                <h3
                  className="text-2xl font-normal mb-1"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: tier.popular ? '#FAF3E8' : '#1A1008' }}
                >
                  {tier.name}
                </h3>
                <p className="text-xs mb-4" style={{ color: tier.popular ? '#B89A7A' : '#8B7355' }}>
                  Up to {tier.maxItems} items
                </p>
                <div
                  className="text-2xl font-semibold mb-4"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: tier.popular ? '#D4A96A' : '#9B6B3C' }}
                >
                  ₹{tier.price.toLocaleString()}
                </div>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {tier.perks.map(p => (
                    <li key={p} className="flex gap-2 text-xs" style={{ color: tier.popular ? '#C4A882' : '#5C4A36' }}>
                      <span style={{ color: tier.popular ? '#D4A96A' : '#9B6B3C' }}>✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <div
                  className="w-full py-3 rounded-xl text-sm font-semibold text-center"
                  style={{
                    background: tier.popular ? '#D4A96A' : '#F5EAD8',
                    color: tier.popular ? '#1A1008' : '#9B6B3C',
                  }}
                >
                  Select this tier →
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20" style={{ background: '#FDFAF5' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => { setSelectedTier(null); setSelectedItems([]); }}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: '#8B7355' }}
          >
            <ChevronLeft size={16} />
            Change tier
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: '#FFFFFF', border: '1px solid #EAD9C4' }}>
            <span className="text-sm font-semibold" style={{ color: '#1A1008' }}>{selectedTier.name} Hamper</span>
            <span className="text-xs" style={{ color: '#8B7355' }}>· ₹{selectedTier.price.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* ── Left: Product picker ─────────────────────────────────────── */}
          <div>
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: '#9B6B3C' }}>Step 2 of 2</p>
              <h2
                className="font-normal"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.9rem', color: '#1A1008' }}
              >
                Pick your items
              </h2>
              <p className="text-sm mt-1" style={{ color: '#8B7355' }}>
                Select up to <strong style={{ color: '#9B6B3C' }}>{selectedTier.maxItems} items</strong> for your hamper.
                {!canAdd && selectedItems.length > 0 && (
                  <span className="ml-1" style={{ color: '#C47C5A' }}>Hamper is full!</span>
                )}
              </p>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mt-5 mb-6">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                  style={{
                    background: activeCategory === cat ? '#9B6B3C' : '#F5EAD8',
                    color: activeCategory === cat ? '#FFFFFF' : '#9B6B3C',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.map(product => {
                  const selected = isSelected(product.id);
                  const disabled = !selected && !canAdd;
                  return (
                    <motion.button
                      key={product.id}
                      layout
                      onClick={() => toggleItem(product)}
                      disabled={disabled}
                      className="relative text-left rounded-xl overflow-hidden transition-all duration-200 flex flex-col"
                      style={{
                        background: '#FFFFFF',
                        border: selected ? '2px solid #9B6B3C' : '1.5px solid #EAD9C4',
                        opacity: disabled ? 0.45 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                      whileHover={disabled ? {} : { y: -3 }}
                      whileTap={disabled ? {} : { scale: 0.97 }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: disabled ? 0.45 : 1, scale: 1 }}
                    >
                      {/* Image */}
                      <div className="relative aspect-square" style={{ background: '#F5EAD8' }}>
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        <AnimatePresence>
                          {selected && (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{ background: 'rgba(155, 107, 60, 0.55)' }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <motion.div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ background: '#9B6B3C' }}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              >
                                <Check size={20} className="text-white" />
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div
                          className="absolute top-2 right-2 rounded-full w-6 h-6 flex items-center justify-center text-white transition-all"
                          style={{
                            background: selected ? '#9B6B3C' : 'rgba(255,255,255,0.85)',
                            color: selected ? '#FFF' : '#9B6B3C',
                          }}
                        >
                          {selected ? <Minus size={12} /> : <Plus size={12} />}
                        </div>
                      </div>

                      <div className="p-2.5">
                        <p className="text-xs font-semibold leading-snug" style={{ color: '#1A1008' }}>{product.name}</p>
                        <p className="text-xs font-medium mt-0.5" style={{ color: '#9B6B3C' }}>₹{product.price}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right: Hamper summary ────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1.5px solid #EAD9C4', background: '#FFFFFF' }}
            >
              {/* Progress header */}
              <div className="p-5" style={{ background: '#2D1B0E' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold" style={{ color: '#FAF3E8' }}>{selectedTier.name} Hamper</p>
                  <p className="text-sm font-bold" style={{ color: '#D4A96A' }}>
                    {selectedItems.length} / {selectedTier.maxItems}
                  </p>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#3D2510' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: progress >= 100 ? '#D4A96A' : '#C47C5A' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: '#8B7355' }}>
                  {selectedTier.maxItems - selectedItems.length === 0
                    ? '🎉 Hamper complete!'
                    : `${selectedTier.maxItems - selectedItems.length} more item${selectedTier.maxItems - selectedItems.length !== 1 ? 's' : ''} to add`}
                </p>
              </div>

              {/* Selected items */}
              <div className="p-5 border-b" style={{ borderColor: '#EAD9C4' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9B6B3C' }}>
                  In your hamper
                </p>

                {selectedItems.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                      style={{ background: '#F5EAD8' }}
                    >
                      <ShoppingBag size={20} style={{ color: '#D4B896' }} />
                    </div>
                    <p className="text-sm" style={{ color: '#8B7355' }}>No items yet</p>
                    <p className="text-xs mt-1" style={{ color: '#B0906E' }}>Start picking from the left!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    <AnimatePresence initial={false}>
                      {selectedItems.map(item => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          className="flex items-center gap-2.5 overflow-hidden"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                            style={{ background: '#F5EAD8' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: '#1A1008' }}>{item.name}</p>
                            <p className="text-xs" style={{ color: '#9B6B3C' }}>₹{item.price}</p>
                          </div>
                          <button
                            onClick={() => setSelectedItems(prev => prev.filter(p => p.id !== item.id))}
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors hover:bg-red-50"
                          >
                            <Minus size={11} className="text-red-400" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Price & CTA */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: '#8B7355' }}>Hamper price</span>
                  <span className="font-bold" style={{ color: '#1A1008' }}>₹{total.toLocaleString()}</span>
                </div>
                <div className="flex items-start gap-1.5 mb-4 text-xs" style={{ color: '#B0906E' }}>
                  <Info size={11} className="mt-0.5 flex-shrink-0" />
                  <span>Includes packaging, ribbon, and personalised card.</span>
                </div>

                <motion.button
                  onClick={handleAddToCart}
                  disabled={selectedItems.length === 0}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: selectedItems.length === 0 ? '#EAD9C4' : added ? '#3E6B4F' : '#9B6B3C',
                    color: selectedItems.length === 0 ? '#B0906E' : '#FFFFFF',
                    cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                  whileHover={selectedItems.length > 0 ? { scale: 1.02 } : {}}
                  whileTap={selectedItems.length > 0 ? { scale: 0.97 } : {}}
                >
                  <AnimatePresence mode="wait">
                    {added ? (
                      <motion.span
                        key="added"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-2"
                      >
                        <Check size={16} /> Added to bag!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="default"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingBag size={16} />
                        {selectedItems.length === 0 ? 'Add items to continue' : 'Add to Bag'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {selectedItems.length > 0 && selectedItems.length < selectedTier.maxItems && (
                  <p className="text-center text-xs mt-2" style={{ color: '#B0906E' }}>
                    You can add {selectedTier.maxItems - selectedItems.length} more item{selectedTier.maxItems - selectedItems.length !== 1 ? 's' : ''} — or checkout now
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
