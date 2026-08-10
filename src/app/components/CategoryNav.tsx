import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const CATEGORIES = [
  { name: 'Earrings 🐾',              href: '#earrings'  },
  { name: 'Necklaces 😸',             href: '#necklaces' },
  { name: 'Phone Charms & Keychains 🐾', href: '#charms' },
];

export function CategoryNav() {
  const [active, setActive] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    CATEGORIES.forEach(c => {
      const el = document.querySelector(c.href);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className="sticky top-0 z-50 py-3 px-4"
      style={{
        background: 'rgba(255, 248, 250, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '2px solid rgba(255, 105, 180, 0.2)',
        boxShadow: '0 2px 16px rgba(233, 30, 140, 0.08)',
      }}
    >
      <ul className="flex flex-wrap justify-center gap-3 md:gap-8 max-w-3xl mx-auto">
        {CATEGORIES.map((cat, i) => (
          <motion.li
            key={cat.href}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <a
              href={cat.href}
              onClick={e => handleClick(e, cat.href)}
              className="relative inline-block py-1 font-semibold transition-colors duration-200"
              style={{
                color: active === cat.href ? '#e91e8c' : '#ad5e72',
                fontSize: 'clamp(0.75rem, 2.2vw, 0.9rem)',
              }}
            >
              {cat.name}
              {active === cat.href && (
                <motion.span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: '#e91e8c' }}
                  layoutId="nav-underline"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </a>
          </motion.li>
        ))}
      </ul>
    </nav>
  );
}
