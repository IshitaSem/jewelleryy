import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Menu, X } from 'lucide-react';
import type { View, CartItem } from '../data';

interface HamperHeaderProps {
  view: View;
  setView: (v: View) => void;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (o: boolean) => void;
}

const NAV = [
  { label: 'Shop', view: 'shop' as View },
  { label: 'Build a Hamper', view: 'builder' as View, hot: true },
  { label: 'Guide', view: 'guide' as View },
];

const TICKER_TEXT = '✦ BUILD YOUR DREAM HAMPER ✦ FREE DELIVERY ON ₹2000+ ✦ PREMIUM PACKAGING INCLUDED ✦ HANDCRAFTED WITH LOVE ✦ SAME-DAY DISPATCH ✦ UPI PAYMENTS ACCEPTED ✦ ';

export function HamperHeader({ view, setView, cart, cartOpen, setCartOpen }: HamperHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* ── Announcement ticker (Y2K / FurF-inspired) ── */}
      <div
        style={{
          background: '#0F0A1A',
          overflow: 'hidden',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 'max-content',
            animation: 'marquee-scroll 28s linear infinite',
          }}
        >
          {[1, 2, 3, 4].map(i => (
            <span
              key={i}
              style={{
                whiteSpace: 'nowrap',
                paddingRight: '0px',
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.06em',
                color: '#FFD166',
              }}
            >
              {TICKER_TEXT}
            </span>
          ))}
        </div>
      </div>

      {/* ── Main header ── */}
      <header
        className="fixed left-0 right-0 z-50 transition-all duration-300"
        style={{
          top: '36px',
          background: scrolled ? 'rgba(255,240,245,0.97)' : 'rgba(255,240,245,0.94)',
          backdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '2px solid rgba(255,45,120,0.2)' : '2px solid transparent',
          boxShadow: scrolled ? '0 4px 32px rgba(255,45,120,0.08)' : 'none',
          padding: scrolled ? '10px 0' : '16px 0',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2.5 group"
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#FF2D78',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                boxShadow: '2px 2px 0px #0F0A1A',
              }}
            >
              🎁
            </div>
            <span
              style={{
                fontFamily: "'Pacifico', cursive",
                fontSize: '1.3rem',
                color: '#0F0A1A',
                letterSpacing: '-0.01em',
              }}
            >
              gift&apos;n&apos;hamper
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(n => (
              <button
                key={n.view}
                onClick={() => setView(n.view)}
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 600,
                  fontSize: '15px',
                  color: n.hot ? '#FFFFFF' : view === n.view ? '#FF2D78' : '#0F0A1A',
                  background: n.hot ? '#FF2D78' : view === n.view ? '#FFD6E8' : 'transparent',
                  borderRadius: '100px',
                  padding: n.hot ? '7px 18px' : '7px 14px',
                  border: n.hot ? '2px solid #0F0A1A' : '2px solid transparent',
                  boxShadow: n.hot ? '2px 2px 0px #0F0A1A' : 'none',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                {n.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <button
              onClick={() => { setCartOpen(!cartOpen); setMobileOpen(false); }}
              aria-label="Cart"
              style={{
                position: 'relative',
                padding: '8px',
                borderRadius: '50%',
                background: cartCount > 0 ? '#FFD6E8' : 'transparent',
                border: cartCount > 0 ? '2px solid #FF2D78' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ShoppingBag size={20} style={{ color: '#0F0A1A' }} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#FF2D78',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 800,
                      fontFamily: "'Fredoka', sans-serif",
                      border: '2px solid #0F0A1A',
                    }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Admin */}
            <button
              onClick={() => setView('admin')}
              className="hidden md:block"
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 600,
                fontSize: '13px',
                color: '#9B4A6B',
                padding: '6px 12px',
                borderRadius: '100px',
                border: '1.5px solid rgba(255,45,120,0.25)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Admin
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen(m => !m)}
              aria-label="Menu"
              style={{
                padding: '8px',
                borderRadius: '50%',
                background: mobileOpen ? '#FFD6E8' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {mobileOpen
                ? <X size={20} style={{ color: '#0F0A1A' }} />
                : <Menu size={20} style={{ color: '#0F0A1A' }} />
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40"
            style={{ paddingTop: '108px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'rgba(15,10,26,0.4)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="relative z-10"
              style={{
                background: '#FFFFFF',
                borderBottom: '3px solid #0F0A1A',
                boxShadow: '0 8px 40px rgba(15,10,26,0.18)',
              }}
              initial={{ y: -16 }}
              animate={{ y: 0 }}
              exit={{ y: -16 }}
            >
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {NAV.map(n => (
                  <button
                    key={n.view}
                    onClick={() => { setView(n.view); setMobileOpen(false); }}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontFamily: "'Fredoka', sans-serif",
                      fontWeight: 600,
                      fontSize: '17px',
                      color: n.hot ? '#FF2D78' : '#0F0A1A',
                      background: n.hot ? '#FFF0F5' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {n.hot ? '🎁 ' : ''}{n.label}
                  </button>
                ))}
                <button
                  onClick={() => { setView('admin'); setMobileOpen(false); }}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 600,
                    fontSize: '17px',
                    color: '#9B4A6B',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Admin Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
