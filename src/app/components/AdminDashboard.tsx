import { useState } from 'react';
import { motion } from 'motion/react';
import { Package, CheckCircle, Clock, XCircle, DollarSign, TrendingUp, Eye, X } from 'lucide-react';

const mockOrders = [
  { id: 'GH291834', name: 'Priya Sharma', items: 'Deluxe Hamper (8 items)', amount: 2499, status: 'pending', date: '2025-01-15', city: 'Mumbai', screenshot: true },
  { id: 'GH291821', name: 'Arjun Mehta', items: 'Classic Hamper (5 items)', amount: 1499, status: 'verified', date: '2025-01-14', city: 'Delhi', screenshot: true },
  { id: 'GH291809', name: 'Sneha Reddy', items: 'Grand Hamper (12 items)', amount: 3999, status: 'dispatched', date: '2025-01-14', city: 'Hyderabad', screenshot: true },
  { id: 'GH291798', name: 'Rohan Gupta', items: 'Petite Hamper (3 items)', amount: 999, status: 'pending', date: '2025-01-13', city: 'Bengaluru', screenshot: true },
  { id: 'GH291785', name: 'Kavya Nair', items: 'Classic Hamper (5 items) + Dark Chocolate Bar', amount: 1698, status: 'delivered', date: '2025-01-12', city: 'Chennai', screenshot: true },
  { id: 'GH291770', name: 'Vikram Singh', items: 'Deluxe Hamper (8 items)', amount: 2499, status: 'verified', date: '2025-01-11', city: 'Jaipur', screenshot: true },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  pending: { label: 'Pending verification', color: '#B85C00', bg: '#FFF4E5', icon: <Clock size={13} /> },
  verified: { label: 'Payment verified', color: '#9B6B3C', bg: '#F5EAD8', icon: <CheckCircle size={13} /> },
  dispatched: { label: 'Dispatched', color: '#2563EB', bg: '#EFF6FF', icon: <Package size={13} /> },
  delivered: { label: 'Delivered', color: '#3E6B4F', bg: '#EFF7F2', icon: <CheckCircle size={13} /> },
};

export function AdminDashboard() {
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = [
    { label: 'Total orders', value: '48', sub: 'This month', icon: <Package size={18} />, color: '#9B6B3C' },
    { label: 'Pending verification', value: '7', sub: 'Awaiting review', icon: <Clock size={18} />, color: '#B85C00' },
    { label: 'Revenue', value: '₹1.24L', sub: 'This month', icon: <DollarSign size={18} />, color: '#3E6B4F' },
    { label: 'Avg order value', value: '₹2,166', sub: 'Up 8% from last month', icon: <TrendingUp size={18} />, color: '#2563EB' },
  ];

  const filtered = filterStatus === 'all' ? mockOrders : mockOrders.filter(o => o.status === filterStatus);

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ background: '#FDFAF5' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: '#9B6B3C' }}>Admin panel</p>
          <h1
            className="font-normal"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#1A1008' }}
          >
            Order Dashboard
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="rounded-2xl p-5 bg-white"
              style={{ border: '1px solid #EAD9C4' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}18`, color: s.color }}
                >
                  {s.icon}
                </div>
              </div>
              <p className="text-2xl font-bold mb-0.5" style={{ color: '#1A1008', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem' }}>
                {s.value}
              </p>
              <p className="text-xs font-semibold" style={{ color: '#5C4A36' }}>{s.label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#B0906E' }}>{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Orders table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #EAD9C4', background: '#FFFFFF' }}>
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b" style={{ borderColor: '#EAD9C4' }}>
            <h2 className="font-semibold" style={{ color: '#1A1008' }}>Recent Orders</h2>
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'verified', 'dispatched', 'delivered'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
                  style={{
                    background: filterStatus === s ? '#9B6B3C' : '#F5EAD8',
                    color: filterStatus === s ? '#FFFFFF' : '#9B6B3C',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FDFAF5' }}>
                  {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#8B7355' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => {
                  const sc = STATUS_CONFIG[order.status];
                  return (
                    <motion.tr
                      key={order.id}
                      className="border-t hover:bg-[#FDFAF5] transition-colors"
                      style={{ borderColor: '#F5EAD8' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono font-semibold" style={{ color: '#9B6B3C' }}>{order.id}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold" style={{ color: '#1A1008' }}>{order.name}</p>
                        <p className="text-xs" style={{ color: '#8B7355' }}>{order.city}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm max-w-[180px] truncate" style={{ color: '#5C4A36' }}>{order.items}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold" style={{ color: '#1A1008' }}>₹{order.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {sc.icon}
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#8B7355' }}>
                        {order.date}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-[#F5EAD8]"
                          style={{ color: '#9B6B3C' }}
                        >
                          <Eye size={13} />
                          View
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedOrder(null)} />
          <motion.div
            className="relative z-10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            style={{ background: '#FFFFFF', border: '1.5px solid #EAD9C4' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#EAD9C4' }}>
              <div>
                <h3 className="font-semibold" style={{ color: '#1A1008' }}>Order {selectedOrder.id}</h3>
                <p className="text-xs" style={{ color: '#8B7355' }}>{selectedOrder.date}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-full hover:bg-[#F5EAD8]">
                <X size={16} style={{ color: '#5C4A36' }} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                ['Customer', selectedOrder.name],
                ['City', selectedOrder.city],
                ['Items', selectedOrder.items],
                ['Amount', `₹${selectedOrder.amount.toLocaleString()}`],
                ['Status', STATUS_CONFIG[selectedOrder.status].label],
                ['Payment screenshot', selectedOrder.screenshot ? 'Uploaded ✓' : 'Not uploaded'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 text-sm">
                  <span style={{ color: '#8B7355' }}>{k}</span>
                  <span className="font-semibold text-right" style={{ color: '#1A1008' }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 flex gap-3">
              {selectedOrder.status === 'pending' && (
                <button
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#3E6B4F' }}
                >
                  Verify Payment
                </button>
              )}
              {selectedOrder.status === 'verified' && (
                <button
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#2563EB' }}
                >
                  Mark Dispatched
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#F5EAD8', color: '#9B6B3C' }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
