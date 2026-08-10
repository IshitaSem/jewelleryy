import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Product } from './ProductModal';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
}

export function ProductCard({ product, onProductClick }: ProductCardProps) {
  return (
    <motion.button
      onClick={() => onProductClick(product)}
      className="text-left focus:outline-none group"
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      <div
        className="rounded-2xl p-4 text-center transition-shadow duration-300"
        style={{
          background: '#fff0f5',
          border: '2px solid rgba(255, 105, 180, 0.2)',
          boxShadow: '0 2px 12px rgba(233, 30, 140, 0.06)',
          width: 152,
        }}
      >
        {/* Product image thumbnail */}
        <div
          className="rounded-full mx-auto mb-3 overflow-hidden bg-[#ffd1dc]"
          style={{
            width: 96,
            height: 96,
            border: '2.5px solid rgba(255, 105, 180, 0.4)',
            boxShadow: '0 4px 14px rgba(233, 30, 140, 0.12)',
          }}
        >
          <ImageWithFallback
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-110"
          />
        </div>

        <h3
          className="text-[#e91e8c] mb-1 leading-tight"
          style={{ fontFamily: "'Pacifico', cursive", fontSize: '0.85rem' }}
        >
          {product.name}
        </h3>

        <p
          className="font-bold mb-3"
          style={{ color: '#c2185b', fontSize: '0.9rem' }}
        >
          {product.price}
        </p>

        <div
          className="text-white text-xs rounded-full px-3 py-1.5 font-semibold transition-all duration-200 inline-block group-hover:shadow-md"
          style={{
            background: 'linear-gradient(135deg, #ff69b4, #e91e8c)',
          }}
        >
          View Details
        </div>
      </div>
    </motion.button>
  );
}
