import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import type { CartItem, View } from '../data';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQty: (cartId: string, qty: number) => void;
  removeFromCart: (cartId: string) => void;
  setView: (v: View) => void;
}

export function CartDrawer({ open, onClose, cart, updateQty, removeFromCart, setView }: CartDrawerProps) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivery = subtotal > 2000 ? 0 : 99;
  const total = subtotal + delivery;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-[420px] flex flex-col shadow-2xl"
            style={{ background: '#FFF0F5' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#EAD9C4' }}>
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} style={{ color: '#9B6B3C' }} />
                <h2 className="font-semibold" style={{ color: '#1A1008' }}>
                  Your Bag
                  {cart.length > 0 && (
                    <span className="ml-2 text-sm font-normal" style={{ color: '#8B7355' }}>
                      ({cart.reduce((s, i) => s + i.quantity, 0)} items)
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#F5EAD8] transition-colors"
                aria-label="Close cart"
              >
                <X size={18} style={{ color: '#5C4A36' }} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <AnimatePresence initial={false}>
                {cart.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-64 text-center"
                  >
                    <ShoppingBag size={40} style={{ color: '#D4B896' }} className="mb-4" />
                    <p className="font-medium" style={{ color: '#8B7355' }}>Your bag is empty</p>
                    <p className="text-sm mt-1" style={{ color: '#B0906E' }}>Add something beautiful!</p>
                    <button
                      onClick={() => { setView('shop'); onClose(); }}
                      className="mt-4 text-sm font-medium px-4 py-2 rounded-full"
                      style={{ background: '#F5EAD8', color: '#9B6B3C' }}
                    >
                      Browse gifts
                    </button>
                  </motion.div>
                ) : (
                  cart.map(item => (
                    <motion.div
                      key={item.cartId}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      className="flex gap-3 p-3 rounded-xl"
                      style={{ background: '#FFFFFF', border: '1px solid #EAD9C4' }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        style={{ background: '#F5EAD8' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#1A1008' }}>{item.name}</p>
                        {item.type === 'hamper' && item.hamperItems && (
                          <p className="text-xs mt-0.5" style={{ color: '#8B7355' }}>
                            {item.hamperItems.length} items · {item.tier?.name} tier
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 rounded-full px-2 py-1" style={{ background: '#F5EAD8' }}>
                            <button
                              onClick={() => item.quantity > 1 ? updateQty(item.cartId, item.quantity - 1) : removeFromCart(item.cartId)}
                              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#EAD9C4] transition-colors text-sm font-bold"
                              style={{ color: '#9B6B3C' }}
                            >
                              −
                            </button>
                            <span className="text-xs font-semibold w-4 text-center" style={{ color: '#1A1008' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.cartId, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#EAD9C4] transition-colors text-sm font-bold"
                              style={{ color: '#9B6B3C' }}
                            >
                              +
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: '#1A1008' }}>
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.cartId)}
                              className="p-1 rounded hover:bg-red-50 transition-colors"
                              aria-label="Remove"
                            >
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Summary & CTA */}
            {cart.length > 0 && (
              <div className="border-t px-6 py-5 space-y-3" style={{ borderColor: '#EAD9C4', background: '#FFFFFF' }}>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm" style={{ color: '#8B7355' }}>
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ color: '#8B7355' }}>
                    <span>Delivery</span>
                    <span>{delivery === 0 ? 'Free' : `₹${delivery}`}</span>
                  </div>
                  {delivery > 0 && (
                    <p className="text-xs" style={{ color: '#B0906E' }}>
                      Free delivery on orders above ₹2,000
                    </p>
                  )}
                  <div className="flex justify-between font-semibold text-base pt-2 border-t" style={{ borderColor: '#EAD9C4', color: '#1A1008' }}>
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>
                <motion.button
                  onClick={() => { setView('checkout'); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-sm"
                  style={{ background: '#9B6B3C' }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </motion.button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
