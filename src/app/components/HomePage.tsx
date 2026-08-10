import { useState } from 'react';
import { motion } from 'motion/react';
import { Instagram } from 'lucide-react';
import { CATEGORIES, POPULAR_PRODUCTS, HAMPER_TIERS, BUILDER_IMAGE } from '../data';
import type { CartItem, View } from '../data';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface HomePageProps {
  setView: (v: View) => void;
  addToCart: (item: CartItem) => void;
}

// ─── Palette + font tokens ─────────────────────────────────────────────────────

const P = '#FF2D78';   // hot pink
const D = '#0F0A1A';   // near black
const C = '#FFF0F5';   // cream
const B = '#FFE4EC';   // blush
const G = '#FFD166';   // gold
const FF = "'Fredoka', sans-serif";
const PP = "'Pacifico', cursive";
const NN = "'Nunito', sans-serif";

// ─── Section dividers ───────────────────────────────────────────────────────────

// Kale café–style smooth wave
function WaveDown({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ background: from, lineHeight: 0, marginBottom: '-2px' }}>
      <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '44px' }}>
        <path d="M0,56 L0,28 C240,56 480,0 720,28 C960,56 1200,14 1440,28 L1440,56 Z" fill={to} />
      </svg>
    </div>
  );
}

// Nectar-style scalloped bumps pointing downward into next section
function ScallopDown({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ background: to, lineHeight: 0, marginTop: '-2px' }}>
      <svg viewBox="0 0 1440 36" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '32px' }}>
        <path d="M0,0 L0,16 Q180,36 360,16 Q540,0 720,16 Q900,36 1080,16 Q1260,0 1440,16 L1440,0 Z" fill={from} />
      </svg>
    </div>
  );
}

// Scalloped bumps pointing upward into current section
function ScallopUp({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ background: from, lineHeight: 0, marginBottom: '-2px' }}>
      <svg viewBox="0 0 1440 36" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '32px' }}>
        <path d="M0,36 L0,20 Q180,0 360,20 Q540,36 720,20 Q900,0 1080,20 Q1260,36 1440,20 L1440,36 Z" fill={to} />
      </svg>
    </div>
  );
}

// ─── Hero Section  [FurF × Kale × Sweet&Tasty] ────────────────────────────────

const STICKERS = [
  { e: '✨', x: '7%',  y: '22%', r: 12,  s: '26px', d: 0   },
  { e: '🎁', x: '84%', y: '25%', r: -10, s: '34px', d: 0.4 },
  { e: '💕', x: '4%',  y: '68%', r: -15, s: '22px', d: 0.8 },
  { e: '⭐', x: '91%', y: '64%', r: 20,  s: '28px', d: 0.2 },
  { e: '🌸', x: '74%', y: '11%', r: -6,  s: '24px', d: 0.6 },
  { e: '🎀', x: '22%', y: '88%', r: 8,   s: '30px', d: 0.3 },
  { e: '💎', x: '89%', y: '82%', r: -12, s: '20px', d: 0.7 },
  { e: '✦',  x: '47%', y: '7%',  r: 0,   s: '18px', d: 0.5 },
];

function HeroSection({ setView }: { setView: (v: View) => void }) {
  return (
    <section
      style={{
        background: P, paddingTop: '108px', position: 'relative',
        overflow: 'hidden', minHeight: '88vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}
    >
      {/* Floating sticker decorations */}
      {STICKERS.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute', left: s.x, top: s.y, fontSize: s.s,
            pointerEvents: 'none', zIndex: 1, display: 'block',
            transform: `rotate(${s.r}deg)`,
            animation: `float-y ${3 + s.d * 0.6}s ease-in-out infinite`,
            animationDelay: `${s.d}s`,
          }}
        >{s.e}</span>
      ))}

      <div
        style={{
          maxWidth: '1240px', margin: '0 auto',
          padding: '40px 24px 80px',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '48px', alignItems: 'center', position: 'relative', zIndex: 2,
        }}
        className="max-[640px]:!grid-cols-1"
      >
        {/* Left — headline */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: G, color: D, borderRadius: '100px',
              padding: '6px 18px', fontSize: '12px',
              fontFamily: FF, fontWeight: 700,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              marginBottom: '24px', transform: 'rotate(-2deg)',
              border: '2px solid rgba(15,10,26,0.15)',
              boxShadow: '2px 2px 0px rgba(15,10,26,0.15)',
            }}
          >
            ✦ Premium Gift Hampers
          </div>

          <h1
            style={{
              fontFamily: FF, fontWeight: 700,
              fontSize: 'clamp(3.2rem, 7.5vw, 6.8rem)',
              color: '#FFFFFF', lineHeight: 0.95,
              letterSpacing: '-0.025em', marginBottom: '22px',
            }}
          >
            THE<br />PERFECT<br /><span style={{ color: G }}>GIFT.</span>
          </h1>

          <p style={{ fontFamily: NN, fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, marginBottom: '36px', maxWidth: '400px' }}>
            Handcrafted hampers for birthdays, anniversaries, and every celebration in between.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <motion.button
              onClick={() => setView('builder')}
              style={{ background: D, color: G, fontFamily: FF, fontWeight: 700, fontSize: '16px', padding: '14px 28px', borderRadius: '100px', border: `2.5px solid ${D}`, boxShadow: '4px 4px 0px rgba(255,255,255,0.28)', cursor: 'pointer', letterSpacing: '0.02em' }}
              whileHover={{ y: -3, boxShadow: '6px 6px 0px rgba(255,255,255,0.28)' }}
              whileTap={{ y: 0, boxShadow: '2px 2px 0px rgba(255,255,255,0.28)' }}
            >
              Build Your Hamper →
            </motion.button>
            <motion.button
              onClick={() => setView('shop')}
              style={{ background: 'transparent', color: '#FFFFFF', fontFamily: FF, fontWeight: 700, fontSize: '16px', padding: '14px 28px', borderRadius: '100px', border: '2.5px solid rgba(255,255,255,0.45)', cursor: 'pointer' }}
              whileHover={{ background: 'rgba(255,255,255,0.12)' }}
              whileTap={{ scale: 0.97 }}
            >
              Shop Gifts
            </motion.button>
          </div>
        </motion.div>

        {/* Right — hero image (circular frame with gingham ring + floating badges) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          className="max-[640px]:!hidden"
        >
          <div style={{ position: 'relative' }}>
            {/* Spinning dashed ring */}
            <div style={{ position: 'absolute', inset: '-18px', borderRadius: '50%', border: '3px dashed rgba(255,255,255,0.4)', animation: 'spin-slow 18s linear infinite' }} />
            {/* Gingham ring (Y2K checkered) */}
            <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', background: 'repeating-conic-gradient(rgba(255,255,255,0.25) 0% 25%, transparent 0% 50%) 0 0 / 18px 18px' }} />
            {/* Main circle image */}
            <div style={{ width: 'clamp(260px, 28vw, 400px)', height: 'clamp(260px, 28vw, 400px)', borderRadius: '50%', overflow: 'hidden', border: '6px solid rgba(255,255,255,0.5)', boxShadow: '0 24px 80px rgba(15,10,26,0.28)', background: '#FFFFFF' }}>
              <img src={BUILDER_IMAGE} alt="Gift hamper" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {/* Floating badge stickers (Kale café style) */}
            <div style={{ position: 'absolute', top: '8%', right: '-14%', background: '#FFFFFF', borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontFamily: FF, fontWeight: 700, color: P, boxShadow: '2px 4px 16px rgba(15,10,26,0.18)', border: `2px solid ${P}`, whiteSpace: 'nowrap' }}>
              🎉 4 Tiers
            </div>
            <div style={{ position: 'absolute', bottom: '11%', left: '-16%', background: G, borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontFamily: FF, fontWeight: 700, color: D, boxShadow: '2px 4px 16px rgba(15,10,26,0.18)', border: `2px solid ${D}`, whiteSpace: 'nowrap', transform: 'rotate(-4deg)' }}>
              ₹999 onwards
            </div>
          </div>
        </motion.div>
      </div>

      <WaveDown from={P} to={C} />
    </section>
  );
}

// ─── Gingham Marquee  [FurF × Nectar] ─────────────────────────────────────────

function GinghamMarquee() {
  const txt = '✦ BUILD YOUR HAMPER ✦ HANDCRAFTED WITH LOVE ✦ FREE DELIVERY ON ₹2000+ ✦ PREMIUM PACKAGING ✦ CURATED WITH CARE ✦ PERFECT FOR GIFTING ✦ ';
  return (
    <div style={{ background: 'repeating-conic-gradient(#FF2D78 0% 25%, #FF82AD 0% 50%) 0 0 / 24px 24px', overflow: 'hidden', padding: '14px 0' }}>
      <div style={{ display: 'flex', width: 'max-content', animation: 'marquee-scroll 26s linear infinite' }}>
        {[1, 2, 3, 4].map(i => (
          <span key={i} style={{ whiteSpace: 'nowrap', fontFamily: FF, fontWeight: 700, fontSize: '14px', color: '#FFFFFF', letterSpacing: '0.09em', textTransform: 'uppercase', textShadow: '1px 1px 0px rgba(15,10,26,0.25)' }}>
            {txt}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Categories  [Nectar polaroids + Layla rounded grid] ──────────────────────

const ROTS = [-2.5, 1.8, -1.4, 2.2, -3.1, 1.6];

function CategoriesSection({ setView }: { setView: (v: View) => void }) {
  return (
    <section style={{ background: C, padding: '80px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <p style={{ fontFamily: FF, fontWeight: 700, fontSize: '13px', letterSpacing: '0.15em', color: P, textTransform: 'uppercase', marginBottom: '10px' }}>
            — Shop by category —
          </p>
          <h2 style={{ fontFamily: PP, fontSize: 'clamp(1.9rem, 4vw, 3rem)', color: D, lineHeight: 1.2 }}>
            What&apos;s inside our hampers?
          </h2>
          <p style={{ fontFamily: NN, fontSize: '1rem', color: '#9B4A6B', marginTop: '10px' }}>
            Six curated categories, all handpicked for quality.
          </p>
        </div>

        {/* Polaroid grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '28px' }}>
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.name}
              style={{
                background: '#FFFFFF', padding: '8px 8px 36px',
                boxShadow: '4px 6px 24px rgba(15,10,26,0.1)',
                cursor: 'pointer', rotate: ROTS[i],
                border: '1.5px solid rgba(255,45,120,0.08)',
              }}
              whileHover={{ rotate: 0, scale: 1.08, boxShadow: '8px 12px 40px rgba(255,45,120,0.18)', zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('shop')}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div style={{ overflow: 'hidden', aspectRatio: '1' }}>
                <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ paddingTop: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{cat.emoji}</div>
                <p style={{ fontFamily: PP, fontSize: '12px', color: D }}>{cat.name}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '44px' }}>
          <motion.button
            onClick={() => setView('shop')}
            style={{ background: P, color: '#FFFFFF', fontFamily: FF, fontWeight: 700, fontSize: '15px', padding: '13px 30px', borderRadius: '100px', border: `2.5px solid ${D}`, boxShadow: `3px 3px 0px ${D}`, cursor: 'pointer', letterSpacing: '0.03em' }}
            whileHover={{ y: -2, boxShadow: `5px 5px 0px ${D}` }}
            whileTap={{ y: 1, boxShadow: `1px 1px 0px ${D}` }}
          >
            Browse All Products →
          </motion.button>
        </div>
      </div>
    </section>
  );
}

// ─── Popular Products  [Y2K Dollhouse window cards] ────────────────────────────

const WIN_COLORS = [P, D, '#7B2D5E', P, D, '#7B2D5E'];

function PopularSection({ addToCart }: { addToCart: (item: CartItem) => void }) {
  const [added, setAdded] = useState<string | null>(null);

  const handleAdd = (product: typeof POPULAR_PRODUCTS[0]) => {
    addToCart({ cartId: product.id, type: 'product', name: product.name, price: product.price, quantity: 1, image: product.image });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1400);
  };

  return (
    <section style={{ background: 'repeating-conic-gradient(#FFE4EC 0% 25%, #FFF0F5 0% 50%) 0 0 / 28px 28px', padding: '72px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-block', background: P, color: '#FFFFFF', fontFamily: FF, fontWeight: 700, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 18px', borderRadius: '100px', border: `2px solid ${D}`, boxShadow: `2px 2px 0px ${D}`, marginBottom: '16px', transform: 'rotate(-1.5deg)' }}>
            ⭐ Customer Favourites
          </div>
          <h2 style={{ fontFamily: FF, fontWeight: 700, fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', color: D, lineHeight: 1.0, letterSpacing: '-0.02em' }}>
            POPULAR PICKS
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {POPULAR_PRODUCTS.map((product, i) => (
            <motion.div
              key={product.id}
              style={{ border: `2.5px solid ${D}`, borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF', boxShadow: `4px 4px 0px ${D}` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -5, boxShadow: `6px 8px 0px ${D}` }}
            >
              {/* Y2K title bar */}
              <div style={{ background: WIN_COLORS[i], padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: G, border: '1px solid rgba(255,255,255,0.3)' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.2)' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.2)' }} />
                <span style={{ marginLeft: 'auto', fontFamily: FF, fontWeight: 700, fontSize: '10px', color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {product.category}
                </span>
              </div>

              <div style={{ overflow: 'hidden', aspectRatio: '1' }}>
                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ padding: '14px' }}>
                <p style={{ fontFamily: FF, fontWeight: 700, fontSize: '15px', color: D, marginBottom: '4px', lineHeight: 1.3 }}>{product.name}</p>
                <p style={{ fontFamily: NN, fontSize: '14px', color: P, fontWeight: 700 }}>₹{product.price}</p>
                <motion.button
                  onClick={() => handleAdd(product)}
                  style={{ marginTop: '10px', width: '100%', padding: '9px', background: added === product.id ? '#16A34A' : D, color: added === product.id ? '#FFFFFF' : G, borderRadius: '8px', fontFamily: FF, fontWeight: 700, fontSize: '13px', cursor: 'pointer', border: 'none', transition: 'background 0.2s ease', letterSpacing: '0.04em' }}
                  whileTap={{ scale: 0.97 }}
                >
                  {added === product.id ? '✓ Added!' : 'Add to Bag'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Builder Promo  [FurF dark band] ──────────────────────────────────────────

const SPARKS = [
  { e: '✦', x: '3%',   y: '28%', r: 0,   s: '18px' },
  { e: '⭐', x: '95%',  y: '22%', r: 15,  s: '22px' },
  { e: '✦', x: '8%',   y: '74%', r: 30,  s: '14px' },
  { e: '⭐', x: '92%',  y: '70%', r: -10, s: '18px' },
  { e: '✦', x: '50%',  y: '9%',  r: 45,  s: '12px' },
  { e: '✦', x: '50%',  y: '89%', r: 20,  s: '12px' },
];

function BuilderPromo({ setView }: { setView: (v: View) => void }) {
  return (
    <section style={{ background: D, padding: '84px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {SPARKS.map((s, i) => (
        <span key={i} style={{ position: 'absolute', left: s.x, top: s.y, fontSize: s.s, color: G, transform: `rotate(${s.r}deg)`, pointerEvents: 'none', opacity: 0.45 }}>{s.e}</span>
      ))}

      <motion.div
        style={{ maxWidth: '760px', margin: '0 auto', position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p style={{ fontFamily: FF, fontWeight: 700, fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', color: P, marginBottom: '16px' }}>
          ✦ Curated just for you ✦
        </p>
        <h2 style={{ fontFamily: FF, fontWeight: 700, fontSize: 'clamp(2.5rem, 6.5vw, 5.5rem)', color: G, lineHeight: 0.95, letterSpacing: '-0.025em', marginBottom: '20px' }}>
          BUILD YOUR<br />OWN HAMPER
        </h2>
        <p style={{ fontFamily: NN, fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)', maxWidth: '460px', margin: '0 auto 36px', lineHeight: 1.65 }}>
          Choose your tier, pick your products, and we&apos;ll package it beautifully. Starting at just ₹999.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            onClick={() => setView('builder')}
            style={{ background: P, color: '#FFFFFF', fontFamily: FF, fontWeight: 700, fontSize: '16px', padding: '14px 32px', borderRadius: '100px', border: `2.5px solid ${G}`, boxShadow: `4px 4px 0px ${G}`, cursor: 'pointer', letterSpacing: '0.03em' }}
            whileHover={{ y: -3, boxShadow: `6px 6px 0px ${G}` }}
            whileTap={{ y: 0, boxShadow: `2px 2px 0px ${G}` }}
          >
            Start Building →
          </motion.button>
          <motion.button
            onClick={() => setView('guide')}
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.65)', fontFamily: FF, fontWeight: 600, fontSize: '15px', padding: '14px 24px', borderRadius: '100px', border: '2px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
            whileHover={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)' }}
          >
            How it works
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Hamper Tiers  [Y2K Dollhouse window frames] ───────────────────────────────

const TIER_BARS = [P, '#7B2D5E', D, P];

function TiersSection({ setView }: { setView: (v: View) => void }) {
  return (
    <section style={{ background: C, padding: '80px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <h2 style={{ fontFamily: PP, fontSize: 'clamp(2rem, 5vw, 3rem)', color: D, lineHeight: 1.2, marginBottom: '10px' }}>
            Pick your perfect tier
          </h2>
          <p style={{ fontFamily: NN, color: '#9B4A6B', fontSize: '1rem' }}>
            Every tier includes premium packaging — you just choose what goes inside.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {HAMPER_TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              style={{ border: `2.5px solid ${D}`, borderRadius: '14px', overflow: 'hidden', background: tier.popular ? D : '#FFFFFF', boxShadow: tier.popular ? `6px 6px 0px ${P}` : `4px 4px 0px ${D}` }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -5 }}
            >
              {/* Y2K window title bar */}
              <div style={{ background: TIER_BARS[i], padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {[G, 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.35)'].map((c, j) => (
                  <div key={j} style={{ width: 10, height: 10, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.25)' }} />
                ))}
                {tier.popular && (
                  <span style={{ marginLeft: 'auto', background: G, color: D, fontSize: '10px', fontWeight: 800, fontFamily: FF, padding: '2px 9px', borderRadius: '100px', letterSpacing: '0.07em' }}>
                    ★ POPULAR
                  </span>
                )}
              </div>

              <div style={{ padding: '22px' }}>
                <p style={{ fontFamily: FF, fontWeight: 700, fontSize: '22px', color: tier.popular ? '#FFFFFF' : D, marginBottom: '2px' }}>
                  {tier.name}
                </p>
                <p style={{ fontFamily: NN, fontSize: '13px', color: tier.popular ? 'rgba(255,255,255,0.55)' : '#9B4A6B', marginBottom: '16px' }}>
                  {tier.tagline}
                </p>

                <div style={{ marginBottom: '18px' }}>
                  <span style={{ fontFamily: FF, fontWeight: 700, fontSize: '32px', color: tier.popular ? G : P }}>₹{tier.price}</span>
                  <span style={{ fontFamily: NN, fontSize: '13px', color: tier.popular ? 'rgba(255,255,255,0.45)' : '#9B4A6B', marginLeft: '6px' }}>
                    / up to {tier.maxItems} items
                  </span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {tier.perks.map(perk => (
                    <li key={perk} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: tier.popular ? G : P, fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                      <span style={{ fontFamily: NN, fontSize: '13px', color: tier.popular ? 'rgba(255,255,255,0.72)' : '#5C3A4E', lineHeight: 1.4 }}>{perk}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  onClick={() => setView('builder')}
                  style={{ width: '100%', padding: '11px', background: tier.popular ? P : D, color: tier.popular ? '#FFFFFF' : G, borderRadius: '10px', fontFamily: FF, fontWeight: 700, fontSize: '14px', cursor: 'pointer', border: 'none', letterSpacing: '0.04em' }}
                  whileHover={{ opacity: 0.88 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Choose {tier.name}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Why Choose Us  [Nectar cards on blush background] ────────────────────────

const WHY = [
  { e: '🎁', t: 'Premium Packaging',  b: 'Beautiful handcrafted boxes with ribbons and cards included in every tier.' },
  { e: '✍️', t: 'Personalised Notes', b: 'Handwritten messages from you, written on our beautiful notecards.' },
  { e: '🚀', t: 'Fast Dispatch',       b: 'Orders verified and dispatched within 1–2 business days.' },
  { e: '💳', t: 'Easy UPI Payment',    b: 'Scan, pay, upload screenshot — we verify and ship instantly.' },
  { e: '🌿', t: 'Handcrafted Items',   b: 'Artisan-made products sourced from small indie makers.' },
  { e: '💯', t: '100% Satisfaction',   b: "Love your hamper or we make it right, always." },
];

function WhyChooseSection() {
  return (
    <section style={{ background: B, padding: '80px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <h2 style={{ fontFamily: FF, fontWeight: 700, fontSize: 'clamp(2rem, 5vw, 3.8rem)', color: D, lineHeight: 1.0, letterSpacing: '-0.02em' }}>
            WHY CHOOSE US?
          </h2>
          <p style={{ fontFamily: NN, color: '#9B4A6B', fontSize: '1rem', marginTop: '10px' }}>
            Every gift, crafted with intention.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {WHY.map((w, i) => (
            <motion.div
              key={w.t}
              style={{ background: '#FFFFFF', borderRadius: '18px', padding: '26px 20px', border: '2px solid rgba(255,45,120,0.1)', boxShadow: '3px 3px 0px rgba(255,45,120,0.12)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4, boxShadow: '5px 5px 0px rgba(255,45,120,0.22)' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{w.e}</div>
              <p style={{ fontFamily: FF, fontWeight: 700, fontSize: '16px', color: D, marginBottom: '6px' }}>{w.t}</p>
              <p style={{ fontFamily: NN, fontSize: '13px', color: '#7A3A55', lineHeight: 1.55 }}>{w.b}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Social Gallery  [Nectar + Kale polaroid frames] ──────────────────────────

const SOCIAL_IMGS = [
  'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1643122966676-29e8597257f7?w=400&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400&h=400&fit=crop&auto=format',
];
const S_ROTS = [-3.5, 2.1, -1.8, 3.2, -2.6, 1.4];

function SocialSection() {
  return (
    <section style={{ background: C, padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <p style={{ fontFamily: FF, fontWeight: 700, fontSize: '13px', letterSpacing: '0.15em', color: P, textTransform: 'uppercase', marginBottom: '10px' }}>
            — As seen on —
          </p>
          <h2 style={{ fontFamily: PP, fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', color: D, lineHeight: 1.2 }}>
            @giftnhamper
          </h2>
          <p style={{ fontFamily: NN, color: '#9B4A6B', fontSize: '0.95rem', marginTop: '8px' }}>
            Tag us in your unboxing moments 💕
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '24px' }}>
          {SOCIAL_IMGS.map((src, i) => (
            <motion.div
              key={i}
              style={{ background: '#FFFFFF', padding: '8px 8px 34px', boxShadow: '4px 6px 20px rgba(15,10,26,0.1)', rotate: S_ROTS[i] }}
              whileHover={{ rotate: 0, scale: 1.08, zIndex: 10, boxShadow: '8px 12px 40px rgba(255,45,120,0.2)' }}
            >
              <div style={{ overflow: 'hidden', aspectRatio: '1' }}>
                <img src={src} alt={`Gift ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: '#9B4A6B', fontFamily: NN }}>
                📷 @giftnhamper
              </p>
            </motion.div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <motion.a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: P, color: '#FFFFFF', fontFamily: FF, fontWeight: 700, fontSize: '15px', padding: '13px 28px', borderRadius: '100px', border: `2.5px solid ${D}`, boxShadow: `3px 3px 0px ${D}`, textDecoration: 'none' }}
            whileHover={{ y: -2, boxShadow: `5px 5px 0px ${D}` }}
          >
            <Instagram size={18} />
            Follow on Instagram
          </motion.a>
        </div>
      </div>
    </section>
  );
}

// ─── Footer  [FurF dark + Pacifico brand] ─────────────────────────────────────

function FooterSection({ setView }: { setView: (v: View) => void }) {
  return (
    <footer style={{ background: D, padding: '56px 24px 36px', borderTop: `3px solid ${P}` }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '48px' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', border: `2px solid ${G}` }}>
                🎁
              </div>
              <span style={{ fontFamily: PP, fontSize: '1.2rem', color: '#FFFFFF' }}>gift&apos;n&apos;hamper</span>
            </div>
            <p style={{ fontFamily: NN, fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>
              Handcrafted premium gift hampers for every occasion.
            </p>
          </div>

          {/* Shop */}
          <div>
            <p style={{ fontFamily: FF, fontWeight: 700, fontSize: '13px', color: G, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>Shop</p>
            {(['shop', 'builder', 'guide'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ display: 'block', fontFamily: NN, fontSize: '14px', color: 'rgba(255,255,255,0.55)', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', textAlign: 'left' }}>
                {v === 'shop' ? 'All Products' : v === 'builder' ? 'Build a Hamper' : 'Shopping Guide'}
              </button>
            ))}
          </div>

          {/* Info */}
          <div>
            <p style={{ fontFamily: FF, fontWeight: 700, fontSize: '13px', color: G, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>Info</p>
            {['About Us', 'Packaging', 'Delivery', 'Returns'].map(l => (
              <p key={l} style={{ fontFamily: NN, fontSize: '14px', color: 'rgba(255,255,255,0.55)', padding: '4px 0' }}>{l}</p>
            ))}
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontFamily: FF, fontWeight: 700, fontSize: '13px', color: G, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>Contact</p>
            <p style={{ fontFamily: NN, fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75 }}>
              UPI: giftnhamper@upi<br />
              Instagram: @giftnhamper<br />
              Mon–Sat: 10am–7pm
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontFamily: NN, fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>
            © 2024 gift&apos;n&apos;hamper · Handcrafted with ❤️
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[P, G, '#7B2D5E'].map((c, i) => (
              <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: c, opacity: 0.55 }} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function HomePage({ setView, addToCart }: HomePageProps) {
  return (
    <div style={{ fontFamily: NN }}>
      <HeroSection setView={setView} />
      <GinghamMarquee />
      <CategoriesSection setView={setView} />
      <ScallopDown from={C} to={B} />
      <PopularSection addToCart={addToCart} />
      <WaveDown from={B} to={D} />
      <BuilderPromo setView={setView} />
      <WaveDown from={D} to={C} />
      <TiersSection setView={setView} />
      <ScallopUp from={C} to={B} />
      <WhyChooseSection />
      <ScallopDown from={B} to={C} />
      <SocialSection />
      <FooterSection setView={setView} />
    </div>
  );
}
