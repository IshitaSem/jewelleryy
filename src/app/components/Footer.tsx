import { motion } from 'motion/react';
import { Instagram, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer
      className="text-center py-10 px-4"
      style={{ background: '#c2185b' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-lg mx-auto space-y-4"
      >
        <h3
          className="text-white text-2xl"
          style={{ fontFamily: "'Pacifico', cursive" }}
        >
          The Glam Aura ✨
        </h3>

        <p className="text-white/80 text-sm">
          cute lil sparkles &nbsp;•&nbsp; handmade chaos
        </p>

        <motion.a
          href="https://www.instagram.com/theglam._.aura/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-[#e91e8c] font-bold px-5 py-2.5 rounded-full shadow-lg text-sm hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <Instagram size={16} />
          @theglam._.aura
        </motion.a>

        <p
          className="text-white/60 text-xs pt-2 flex items-center justify-center gap-1"
        >
          Made with <Heart size={11} fill="currentColor" className="text-pink-200" /> &nbsp;© 2025 The Glam Aura Jewellery
        </p>
      </motion.div>
    </footer>
  );
}
