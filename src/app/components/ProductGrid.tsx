import { motion } from 'motion/react';
import { ProductCard } from './ProductCard';
import type { Product } from './ProductModal';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export function ProductGrid({ products, onProductClick }: ProductGridProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-5 px-4 max-w-6xl mx-auto">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ delay: index * 0.04, duration: 0.4 }}
        >
          <ProductCard product={product} onProductClick={onProductClick} />
        </motion.div>
      ))}
    </div>
  );
}
