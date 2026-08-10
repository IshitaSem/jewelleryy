import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Upload, X, ChevronRight, ArrowLeft, QrCode, AlertCircle } from 'lucide-react';
import type { CartItem, View } from '../data';

interface CheckoutFlowProps {
  cart: CartItem[];
  clearCart: () => void;
  setView: (v: View) => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  deliveryType: 'standard' | 'priority';
  message: string;
}

const UPI_ID = 'giftnhamper@upi';
const ORDER_PREFIX = 'GH';

function genOrderId() {
  return `${ORDER_PREFIX}${Date.now().toString().slice(-6)}`;
}

// Decorative QR placeholder
function QRPlaceholder({ size = 200 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <rect width="200" height="200" rx="12" fill="white" />
      <rect x="8" y="8" width="184" height="184" rx="10" stroke="#EAD9C4" strokeWidth="2" />
      {/* Corner squares */}
      {[[14,14],[130,14],[14,130]].map(([x,y],i) => (
        <g key={i}>
          <rect x={x} y={y} width="56" height="56" rx="6" fill="#9B6B3C" opacity="0.12"/>
          <rect x={x+6} y={y+6} width="44" height="44" rx="4" fill="#9B6B3C" opacity="0.15"/>
          <rect x={x+14} y={y+14} width="28" height="28" rx="2" fill="#9B6B3C"/>
        </g>
      ))}
      {/* Data modules */}
      {Array.from({length: 8}, (_,row) => Array.from({length: 8}, (_,col) => {
        const skip = (row<4&&col<4)||(row<4&&col>3&&col<8&&row>3)||(row>3&&col<4);
        if (Math.random() > 0.55) return null;
        return <rect key={`${row}-${col}`} x={84+col*6} y={84+row*6} width="5" height="5" rx="1" fill="#9B6B3C" opacity="0.7"/>;
      }))}
      <text x="100" y="178" textAnchor="middle" fontSize="9" fill="#B0906E" fontFamily="DM Sans, sans-serif">Scan to Pay</text>
    </svg>
  );
}

export function CheckoutFlow({ cart, clearCart, setView }: CheckoutFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const [orderId] = useState(genOrderId);
  const [form, setForm] = useState<FormData>({
    name: '', email: '', phone: '', address: '', city: '', pincode: '', state: '',
    deliveryType: 'standard', message: '',
  });
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivery = form.deliveryType === 'priority' ? 199 : subtotal > 2000 ? 0 : 99;
  const total = subtotal + delivery;

  const field = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Please upload an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('File must be under 5MB.'); return; }
    setUploadError('');
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      setTimeout(() => {
        setScreenshot(ev.target?.result as string);
        setUploading(false);
      }, 900);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fake = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(fake);
    }
  };

  const InputField = ({ label, value, onChange, type = 'text', placeholder = '', required = true }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5C4A36' }}>
        {label}{required && <span style={{ color: '#C47C5A' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors"
        style={{
          background: '#FFFFFF',
          borderColor: '#EAD9C4',
          color: '#1A1008',
        }}
        onFocus={e => e.target.style.borderColor = '#9B6B3C'}
        onBlur={e => e.target.style.borderColor = '#EAD9C4'}
      />
    </div>
  );

  const steps: { num: Step; label: string }[] = [
    { num: 1, label: 'Details' },
    { num: 2, label: 'Delivery' },
    { num: 3, label: 'Review' },
    { num: 4, label: 'Payment' },
    { num: 5, label: 'Done' },
  ];

  if (step === 5) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center px-6" style={{ background: '#FDFAF5' }}>
        <motion.div
          className="max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.3 }}
        >
          {/* Animated checkmark */}
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: '#EFF7F2' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', bounce: 0.6 }}
            >
              <Check size={36} style={{ color: '#3E6B4F' }} />
            </motion.div>
          </motion.div>

          {/* Sparkle decorations */}
          {['✦', '✦', '✦'].map((s, i) => (
            <motion.span
              key={i}
              className="absolute text-yellow-400 text-lg"
              style={{ left: `${30 + i * 20}%`, top: `${15 + i * 5}%` }}
              animate={{ y: [0, -12, 0], opacity: [0.6, 1, 0.6], scale: [1, 1.3, 1] }}
              transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
            >
              {s}
            </motion.span>
          ))}

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h1
              className="font-normal mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.4rem', color: '#1A1008' }}
            >
              Order Placed!
            </h1>
            <p className="text-sm mb-6" style={{ color: '#8B7355' }}>
              Thank you, {form.name}. We're reviewing your payment and will begin preparing your hamper soon.
            </p>

            <div
              className="rounded-2xl p-5 mb-6 text-left space-y-2.5"
              style={{ background: '#FFFFFF', border: '1px solid #EAD9C4' }}
            >
              {[
                ['Order ID', orderId],
                ['Amount paid', `₹${total.toLocaleString()}`],
                ['Payment status', 'Verification pending'],
                ['Delivery', form.deliveryType === 'priority' ? 'Priority (2-3 days)' : 'Standard (3-5 days)'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: '#8B7355' }}>{label}</span>
                  <span
                    className="font-semibold"
                    style={{ color: label === 'Payment status' ? '#C47C5A' : '#1A1008' }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="rounded-xl p-4 mb-6 text-left text-sm"
              style={{ background: '#FFF8F0', border: '1px solid #EAD9C4' }}
            >
              <p className="font-semibold mb-1" style={{ color: '#9B6B3C' }}>What happens next?</p>
              <ol className="space-y-1 list-decimal list-inside" style={{ color: '#8B7355' }}>
                <li>Our team verifies your payment (usually within a few hours)</li>
                <li>We hand-assemble and package your hamper</li>
                <li>Dispatched within 1-2 business days</li>
                <li>You receive tracking information via email/WhatsApp</li>
              </ol>
            </div>

            <motion.button
              onClick={() => { clearCart(); setView('home'); }}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm"
              style={{ background: '#9B6B3C' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Continue Shopping
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 md:px-10" style={{ background: '#FDFAF5' }}>
      <div className="max-w-5xl mx-auto">
        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
                    style={{
                      background: s.num < step ? '#3E6B4F' : s.num === step ? '#9B6B3C' : '#EAD9C4',
                      color: s.num <= step ? '#FFFFFF' : '#8B7355',
                    }}
                  >
                    {s.num < step ? <Check size={14} /> : s.num}
                  </div>
                  <span className="text-[10px] mt-1 font-medium hidden sm:block" style={{ color: s.num === step ? '#9B6B3C' : '#B0906E' }}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2 rounded-full transition-all duration-500"
                    style={{ background: s.num < step ? '#9B6B3C' : '#EAD9C4' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Main form area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
              className="bg-white rounded-2xl p-6 md:p-8"
              style={{ border: '1px solid #EAD9C4' }}
            >
              {step === 1 && (
                <>
                  <h2 className="font-semibold text-lg mb-6" style={{ color: '#1A1008' }}>Your details</h2>
                  <div className="space-y-4">
                    <InputField label="Full name" value={form.name} onChange={v => field('name', v)} placeholder="Priya Sharma" />
                    <InputField label="Email address" value={form.email} onChange={v => field('email', v)} type="email" placeholder="priya@example.com" />
                    <InputField label="Mobile number" value={form.phone} onChange={v => field('phone', v)} type="tel" placeholder="+91 98765 43210" />
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5C4A36' }}>
                        Gift message (optional)
                      </label>
                      <textarea
                        value={form.message}
                        onChange={e => field('message', e.target.value)}
                        placeholder="Write a heartfelt message for the recipient..."
                        rows={3}
                        className="w-full rounded-xl px-4 py-3 text-sm border resize-none outline-none"
                        style={{ background: '#FFFFFF', borderColor: '#EAD9C4', color: '#1A1008' }}
                        onFocus={e => e.target.style.borderColor = '#9B6B3C'}
                        onBlur={e => e.target.style.borderColor = '#EAD9C4'}
                      />
                    </div>
                  </div>
                  <motion.button
                    onClick={() => form.name && form.email && form.phone && setStep(2)}
                    className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm"
                    style={{ background: '#9B6B3C' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Continue to Delivery <ChevronRight size={16} />
                  </motion.button>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="font-semibold text-lg mb-6" style={{ color: '#1A1008' }}>Delivery details</h2>
                  <div className="space-y-4">
                    <InputField label="Delivery address" value={form.address} onChange={v => field('address', v)} placeholder="House no., Street, Area" />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="City" value={form.city} onChange={v => field('city', v)} placeholder="Mumbai" />
                      <InputField label="Pincode" value={form.pincode} onChange={v => field('pincode', v)} placeholder="400001" />
                    </div>
                    <InputField label="State" value={form.state} onChange={v => field('state', v)} placeholder="Maharashtra" />
                    <div>
                      <label className="block text-xs font-semibold mb-2.5" style={{ color: '#5C4A36' }}>Delivery speed</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'standard', label: 'Standard', sub: '3-5 business days', price: subtotal > 2000 ? 'Free' : '₹99' },
                          { id: 'priority', label: 'Priority', sub: '1-2 business days', price: '₹199' },
                        ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => field('deliveryType', opt.id as 'standard' | 'priority')}
                            className="p-3.5 rounded-xl text-left border-2 transition-all"
                            style={{
                              background: form.deliveryType === opt.id ? '#FFF8F0' : '#FFFFFF',
                              borderColor: form.deliveryType === opt.id ? '#9B6B3C' : '#EAD9C4',
                            }}
                          >
                            <p className="text-sm font-semibold" style={{ color: '#1A1008' }}>{opt.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#8B7355' }}>{opt.sub}</p>
                            <p className="text-xs font-bold mt-1.5" style={{ color: '#9B6B3C' }}>{opt.price}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm font-medium px-4 py-3 rounded-xl" style={{ color: '#8B7355', background: '#F5EAD8' }}>
                      <ArrowLeft size={14} /> Back
                    </button>
                    <motion.button
                      onClick={() => form.address && form.city && form.pincode && setStep(3)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm"
                      style={{ background: '#9B6B3C' }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Review Order <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="font-semibold text-lg mb-6" style={{ color: '#1A1008' }}>Review your order</h2>
                  <div className="space-y-3 mb-6">
                    {cart.map(item => (
                      <div key={item.cartId} className="flex gap-3 items-center p-3 rounded-xl" style={{ background: '#FDFAF5', border: '1px solid #EAD9C4' }}>
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" style={{ background: '#F5EAD8' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#1A1008' }}>{item.name}</p>
                          {item.type === 'hamper' && <p className="text-xs" style={{ color: '#8B7355' }}>{item.hamperItems?.length} items · {item.tier?.name}</p>}
                          <p className="text-xs" style={{ color: '#8B7355' }}>Qty: {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-sm" style={{ color: '#9B6B3C' }}>₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-4 space-y-2 mb-6" style={{ background: '#F5EAD8' }}>
                    <div className="flex justify-between text-sm" style={{ color: '#8B7355' }}>
                      <span>Deliver to</span>
                      <span className="font-medium text-right max-w-[55%]" style={{ color: '#1A1008' }}>{form.address}, {form.city}</span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ color: '#8B7355' }}>
                      <span>Contact</span>
                      <span className="font-medium" style={{ color: '#1A1008' }}>{form.phone}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm font-medium px-4 py-3 rounded-xl" style={{ color: '#8B7355', background: '#F5EAD8' }}>
                      <ArrowLeft size={14} /> Back
                    </button>
                    <motion.button
                      onClick={() => setStep(4)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm"
                      style={{ background: '#9B6B3C' }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Proceed to Payment <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h2 className="font-semibold text-lg mb-2" style={{ color: '#1A1008' }}>Pay with UPI</h2>
                  <p className="text-sm mb-6" style={{ color: '#8B7355' }}>
                    Scan the QR code or use the UPI ID below, then upload your payment screenshot.
                  </p>

                  {/* QR card */}
                  <div
                    className="rounded-2xl p-6 flex flex-col items-center mb-6"
                    style={{ background: '#FDFAF5', border: '1.5px solid #EAD9C4' }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <QrCode size={16} style={{ color: '#9B6B3C' }} />
                      <span className="text-sm font-semibold" style={{ color: '#9B6B3C' }}>Scan & Pay</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl shadow-sm mb-3" style={{ border: '1.5px solid #EAD9C4' }}>
                      <QRPlaceholder size={180} />
                    </div>
                    <p className="text-xs mb-1" style={{ color: '#8B7355' }}>UPI ID</p>
                    <div className="px-4 py-2 rounded-full font-mono text-sm font-semibold" style={{ background: '#F5EAD8', color: '#9B6B3C' }}>
                      {UPI_ID}
                    </div>
                    <div className="mt-3 px-5 py-2.5 rounded-xl" style={{ background: '#2D1B0E' }}>
                      <p className="text-xs" style={{ color: '#C4A882' }}>Amount to pay</p>
                      <p
                        className="text-2xl font-semibold"
                        style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FAF3E8' }}
                      >
                        ₹{total.toLocaleString()}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#8B7355' }}>Order ID: {orderId}</p>
                    </div>
                  </div>

                  {/* Screenshot upload */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold mb-3" style={{ color: '#5C4A36' }}>
                      Upload payment screenshot
                    </p>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                    {!screenshot ? (
                      <div
                        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
                        style={{ borderColor: '#D4B896', background: '#FDFAF5' }}
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDrop}
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                          style={{ background: '#F5EAD8' }}
                        >
                          {uploading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                              <Upload size={20} style={{ color: '#9B6B3C' }} />
                            </motion.div>
                          ) : (
                            <Upload size={20} style={{ color: '#9B6B3C' }} />
                          )}
                        </div>
                        <p className="text-sm font-medium" style={{ color: '#5C4A36' }}>
                          {uploading ? 'Uploading...' : 'Drag & drop or click to upload'}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#B0906E' }}>PNG, JPG up to 5MB</p>
                        {uploadError && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs justify-center" style={{ color: '#C0392B' }}>
                            <AlertCircle size={12} />
                            {uploadError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden" style={{ border: '2px solid #9B6B3C' }}>
                        <img src={screenshot} alt="Payment screenshot" className="w-full max-h-48 object-cover" />
                        <div
                          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(0,0,0,0.4)' }}
                        >
                          <button
                            onClick={() => setScreenshot(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                            style={{ background: 'rgba(0,0,0,0.6)' }}
                          >
                            <X size={12} /> Replace
                          </button>
                        </div>
                        <div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: '#3E6B4F' }}
                        >
                          <Check size={12} className="text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm font-medium px-4 py-3 rounded-xl" style={{ color: '#8B7355', background: '#F5EAD8' }}>
                      <ArrowLeft size={14} /> Back
                    </button>
                    <motion.button
                      onClick={() => screenshot && setStep(5)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm"
                      style={{
                        background: screenshot ? '#9B6B3C' : '#D4B896',
                        cursor: screenshot ? 'pointer' : 'not-allowed',
                      }}
                      whileHover={screenshot ? { scale: 1.01 } : {}}
                      whileTap={screenshot ? { scale: 0.97 } : {}}
                    >
                      <Check size={16} />
                      Submit Order
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Order summary sidebar */}
          <div
            className="rounded-2xl p-5 lg:sticky lg:top-24"
            style={{ background: '#FFFFFF', border: '1px solid #EAD9C4' }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#1A1008' }}>Order summary</h3>
            <div className="space-y-3 mb-4">
              {cart.map(item => (
                <div key={item.cartId} className="flex gap-2.5 items-start">
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" style={{ background: '#F5EAD8' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-snug truncate" style={{ color: '#1A1008' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: '#8B7355' }}>×{item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: '#9B6B3C' }}>₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1.5" style={{ borderColor: '#EAD9C4' }}>
              <div className="flex justify-between text-xs" style={{ color: '#8B7355' }}>
                <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: '#8B7355' }}>
                <span>Delivery</span><span>{delivery === 0 ? 'Free' : `₹${delivery}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t" style={{ borderColor: '#EAD9C4', color: '#1A1008' }}>
                <span>Total</span><span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
