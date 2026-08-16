import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Instagram } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: string;
  images: string[];
}

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  const images = product?.images ?? [];
  const total = images.length;

  const prev = () => setCurrentIndex(i => (i - 1 + total) % total);
  const next = () => setCurrentIndex(i => (i + 1) % total);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(26, 10, 15, 0.72)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal card */}
          <motion.div
            className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-[340px] overflow-hidden"
            style={{ border: '3px solid rgba(255, 105, 180, 0.3)' }}
            initial={{ scale: 0.75, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.75, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              aria-label="Close"
            >
              <X size={16} className="text-[#ff1493]" />
            </button>

            {/* Image carousel */}
            <div
              className="relative overflow-hidden"
              style={{ aspectRatio: '1', background: '#fff0f5' }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={currentIndex}
                  src={images[currentIndex]}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                />
              </AnimatePresence>

              {total > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/85 rounded-full w-9 h-9 flex items-center justify-center shadow hover:scale-110 transition-transform"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} className="text-[#ff1493]" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/85 rounded-full w-9 h-9 flex items-center justify-center shadow hover:scale-110 transition-transform"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} className="text-[#ff1493]" />
                  </button>
                </>
              )}

              {/* Image counter badge */}
              {total > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {currentIndex + 1} / {total}
                </div>
              )}
            </div>

            {/* Dot indicators */}
            {total > 1 && (
              <div className="flex justify-center gap-1.5 pt-3 pb-0">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: i === currentIndex ? '16px' : '8px',
                      height: '8px',
                      background: i === currentIndex ? '#ff1493' : '#ffb6c1',
                    }}
                    aria-label={`View image ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Product info */}
            <div className="px-5 pt-3 pb-5 text-center">
              <h3
                className="text-[#ff1493] text-xl mb-1 leading-tight"
                style={{ fontFamily: "'Pacifico', cursive" }}
              >
                {product.name}
              </h3>
              <p className="text-[#c2185b] font-bold text-xl mb-4 tracking-wide">
                {product.price}
              </p>
              <motion.a
                href="https://www.instagram.com/theglam._.aura/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-white px-6 py-3 rounded-full font-semibold shadow-lg text-sm"
                style={{
                  background: 'linear-gradient(135deg, #ff69b4, #e91e8c)',
                }}
                whileHover={{ scale: 1.04, boxShadow: '0 6px 20px rgba(233, 30, 140, 0.4)' }}
                whileTap={{ scale: 0.96 }}
              >
                <Instagram size={16} />
                DM on Instagram to Order
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
