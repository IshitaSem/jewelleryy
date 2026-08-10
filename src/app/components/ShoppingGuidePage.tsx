import { motion } from 'motion/react';
import { Gift, Package, Truck, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { View } from '../data';

interface ShoppingGuidePageProps {
  setView: (v: View) => void;
}

const steps = [
  {
    icon: <Gift size={22} />,
    title: '1. Choose your tier',
    body: 'Select a hamper size based on your budget and the number of items you want to include. Each tier comes with premium packaging included in the price.',
  },
  {
    icon: <Package size={22} />,
    title: '2. Pick your items',
    body: 'Browse our curated collection of artisan products — chocolates, candles, skincare, gourmet snacks, stationery, and dry fruits. Add your favourites up to your tier\'s limit.',
  },
  {
    icon: <MessageCircle size={22} />,
    title: '3. Add a personal note',
    body: 'During checkout, you can include a personalised handwritten message for the recipient. We write it by hand on a beautiful card.',
  },
  {
    icon: <Truck size={22} />,
    title: '4. We deliver with care',
    body: 'Pay securely via UPI and upload your payment screenshot. Our team verifies and dispatches within 1-2 business days. You\'ll receive tracking details once dispatched.',
  },
];

const faqs = [
  { q: 'Can I mix items from different categories?', a: 'Absolutely! Your hamper can include any combination of items from all our categories — chocolates, candles, skincare, gourmet snacks, stationery, and dry fruits.' },
  { q: 'What packaging is included?', a: 'All hampers include premium packaging appropriate to your tier — from kraft gift boxes for Petite to luxury keepsake boxes for Grand. Satin ribbon, tissue paper, and a handwritten note card are included in Classic tier and above.' },
  { q: 'How do I pay?', a: 'We accept UPI payments. After checkout, you\'ll see a QR code and UPI ID. Complete the payment in your UPI app, then upload a screenshot for verification. Your order is processed once payment is confirmed by our team.' },
  { q: 'How long does delivery take?', a: 'We dispatch within 1-2 business days after payment verification. Delivery typically takes 3-5 business days depending on your location. Priority delivery is available for Grand tier orders.' },
  { q: 'Can I customise the packaging?', a: 'Yes! At checkout you can choose from available packaging options and add a personalised message. For special requests, contact us directly before placing your order.' },
  { q: 'What if items are out of stock?', a: 'All items shown are available unless indicated otherwise. If an item becomes unavailable after your order, we\'ll contact you to select a replacement of equal or higher value.' },
  { q: 'Do you offer returns?', a: 'As our hampers are custom-curated, we cannot accept returns on personal preference. However, if items arrive damaged or there is an error on our part, we will make it right with a replacement or refund.' },
];

export function ShoppingGuidePage({ setView }: ShoppingGuidePageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ background: '#FDFAF5' }}>
      <div className="max-w-3xl mx-auto px-6 md:px-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: '#9B6B3C' }}>
            How it works
          </p>
          <h1
            className="font-normal mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', color: '#1A1008' }}
          >
            Your shopping guide
          </h1>
          <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: '#8B7355' }}>
            Everything you need to know about building, ordering, and receiving your perfect gift hamper.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4 mb-16">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="flex gap-5 p-6 rounded-2xl bg-white"
              style={{ border: '1px solid #EAD9C4' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#F5EAD8', color: '#9B6B3C' }}
              >
                {step.icon}
              </div>
              <div>
                <h3 className="font-semibold mb-1.5" style={{ color: '#1A1008' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8B7355' }}>{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Packaging tiers visual */}
        <motion.div
          className="rounded-2xl overflow-hidden mb-16"
          style={{ background: '#2D1B0E' }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: '#D4A96A' }}>
              What's in the box
            </p>
            <h2
              className="font-normal mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', color: '#FAF3E8' }}
            >
              Packaging inclusions by tier
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { tier: 'Petite', items: ['Kraft gift box', 'Handwritten card'] },
                { tier: 'Classic', items: ['Premium gift box', 'Satin ribbon', 'Handwritten card', 'Tissue wrap'] },
                { tier: 'Deluxe', items: ['Wooden crate', 'Satin ribbon', 'Handwritten card', 'Tissue & shredded paper', 'Free delivery'] },
                { tier: 'Grand', items: ['Luxury keepsake box', 'Wax seal', 'Premium ribbon', 'Full interior styling', 'Priority delivery', 'Personalised note'] },
              ].map(t => (
                <div key={t.tier} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: '#D4A96A' }}>{t.tier}</p>
                  <ul className="space-y-1.5">
                    {t.items.map(item => (
                      <li key={item} className="text-xs" style={{ color: '#C4A882' }}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* FAQs */}
        <div>
          <h2
            className="font-normal mb-6"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', color: '#1A1008' }}
          >
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid #EAD9C4', background: '#FFFFFF' }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold" style={{ color: '#1A1008' }}>{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={16} style={{ color: '#9B6B3C', flexShrink: 0 }} />
                    : <ChevronDown size={16} style={{ color: '#9B6B3C', flexShrink: 0 }} />
                  }
                </button>
                <AnimatedAnswer open={openFaq === i} answer={faq.a} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-14 p-8 rounded-2xl"
          style={{ background: '#F5EAD8', border: '1px solid #EAD9C4' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <h3
            className="font-normal text-2xl mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1A1008' }}
          >
            Ready to build your hamper?
          </h3>
          <p className="text-sm mb-5" style={{ color: '#8B7355' }}>Start with a tier and pick your favourites.</p>
          <motion.button
            onClick={() => setView('builder')}
            className="px-8 py-3.5 rounded-full text-white text-sm font-semibold"
            style={{ background: '#9B6B3C' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Start Building →
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

function AnimatedAnswer({ open, answer }: { open: boolean; answer: string }) {
  return (
    <motion.div
      initial={false}
      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      style={{ overflow: 'hidden' }}
    >
      <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: '#8B7355' }}>{answer}</p>
    </motion.div>
  );
}
