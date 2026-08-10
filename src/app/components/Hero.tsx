import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const FLOATERS = [
  { emoji: '🐾', x: '7%',  y: '22%', size: 36, delay: 0,   dur: 3.2 },
  { emoji: '✨', x: '83%', y: '14%', size: 28, delay: 0.3, dur: 2.8 },
  { emoji: '💖', x: '14%', y: '68%', size: 26, delay: 0.6, dur: 3.5 },
  { emoji: '⭐', x: '78%', y: '62%', size: 32, delay: 0.2, dur: 2.6 },
  { emoji: '🌸', x: '48%', y: '6%',  size: 26, delay: 0.8, dur: 3.8 },
  { emoji: '🐾', x: '91%', y: '44%', size: 24, delay: 0.4, dur: 3.0 },
  { emoji: '✨', x: '4%',  y: '50%', size: 22, delay: 0.7, dur: 2.5 },
  { emoji: '💕', x: '62%', y: '82%', size: 22, delay: 0.5, dur: 3.3 },
  { emoji: '🌟', x: '30%', y: '85%', size: 20, delay: 1.0, dur: 2.9 },
  { emoji: '✨', x: '55%', y: '90%', size: 18, delay: 0.9, dur: 3.6 },
];

export function Hero() {
  const scrollToShop = () => {
    document.querySelector('#earrings')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden py-14 px-4 text-center"
      style={{
        background: 'linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 45%, #ff8fab 100%)',
        borderBottom: '5px dashed rgba(255, 255, 255, 0.55)',
        minHeight: '340px',
      }}
    >
      {/* Floating decorations */}
      {FLOATERS.map((f, i) => (
        <motion.span
          key={i}
          className="absolute pointer-events-none select-none opacity-55"
          style={{ left: f.x, top: f.y, fontSize: f.size }}
          animate={{ y: [0, -9, 0], rotate: [0, 10, 0] }}
          transition={{
            duration: f.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: f.delay,
          }}
        >
          {f.emoji}
        </motion.span>
      ))}

      {/* Main content */}
      <div className="relative z-10 max-w-md mx-auto">
        <motion.div
          className="mb-5 mx-auto"
          style={{ width: 'fit-content' }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.9, bounce: 0.4 }}
        >
          <div
            className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mx-auto shadow-xl"
            style={{ border: '4px solid rgba(255, 255, 255, 0.8)' }}
          >
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1786052337463-6dc59ee399be?w=300&h=300&fit=crop&auto=format"
              alt="The Glam Aura jewellery"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Spinning ring */}
          <motion.div
            className="absolute -inset-2 rounded-full pointer-events-none"
            style={{
              border: '2px dashed rgba(255, 255, 255, 0.6)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h1
            className="text-white mb-2 drop-shadow-md"
            style={{
              fontFamily: "'Pacifico', cursive",
              fontSize: 'clamp(1.6rem, 5vw, 2.6rem)',
              lineHeight: 1.2,
              textShadow: '0 2px 8px rgba(194, 24, 91, 0.3)',
            }}
          >
            The Glam Aura ✨
          </h1>
          <p
            className="text-white/90 mb-6 tracking-wide"
            style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', fontWeight: 600 }}
          >
            cute lil sparkles &nbsp;•&nbsp; handmade chaos 💖
          </p>
        </motion.div>

        <motion.button
          onClick={scrollToShop}
          className="text-[#e91e8c] font-bold rounded-full shadow-xl px-8 py-3"
          style={{
            background: 'white',
            fontSize: '0.9rem',
            boxShadow: '0 4px 20px rgba(233, 30, 140, 0.25)',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.75, type: 'spring', bounce: 0.5 }}
          whileHover={{ scale: 1.06, boxShadow: '0 8px 28px rgba(233, 30, 140, 0.35)' }}
          whileTap={{ scale: 0.94 }}
        >
          Shop Catalogue 🛍️
        </motion.button>
      </div>
    </section>
  );
}
