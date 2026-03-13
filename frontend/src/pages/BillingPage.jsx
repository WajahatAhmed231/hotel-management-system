import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { PlusIcon, EyeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [createForm, setCreateForm] = useState({ reservation_id: '', discount_amount: 0, tax_rate: 0.10 });
  const [payForm, setPayForm] = useState({ invoice_id: '', amount: '', method: 'cash', reference_number: '' });

  const load = async () => {
    try {
      const [inv, res] = await Promise.all([api.get('/billing/invoices'), api.get('/reservations', { params: { status: 'checked_in' } })]);
      setInvoices(inv.data); setReservations(res.data);
    } catch { toast.error('Failed to load billing data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleViewInvoice = async (id) => {
    try {
      const res = await api.get(`/billing/invoices/${id}`);
      setViewInvoice(res.data);
    } catch { toast.error('Failed to load invoice'); }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/billing/invoices', createForm);
      toast.success('Invoice created');
      setShowCreateModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create invoice'); }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/billing/payments', payForm);
      toast.success('Payment recorded');
      setShowPayModal(false);
      if (viewInvoice) { const res = await api.get(`/billing/invoices/${viewInvoice.id}`); setViewInvoice(res.data); }
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Payment failed'); }
  };

  const openPayForInvoice = (invoice) => {
    setPayForm({ invoice_id: invoice.id, amount: invoice.total_amount, method: 'cash', reference_number: '' });
    setShowPayModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-500 text-sm">Invoices and payment management</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Invoice #', 'Guest', 'Room', 'Subtotal', 'Tax', 'Discount', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No invoices yet</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">#{inv.id}</td>
                  <td className="px-4 py-3">{inv.first_name} {inv.last_name}</td>
                  <td className="px-4 py-3">{inv.room_number || '—'}</td>
                  <td className="px-4 py-3">${parseFloat(inv.subtotal).toFixed(2)}</td>
                  <td className="px-4 py-3">${parseFloat(inv.tax_amount).toFixed(2)}</td>
                  <td className="px-4 py-3">${parseFloat(inv.discount_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">${parseFloat(inv.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleViewInvoice(inv.id)} className="text-blue-600 hover:text-blue-800"><EyeIcon className="w-4 h-4" /></button>
                      {inv.status !== 'paid' && (
                        <button onClick={() => openPayForInvoice(inv)} className="text-green-600 hover:text-green-800"><CurrencyDollarIcon className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <Modal title="Create Invoice" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div>
              <label className="label">Reservation (Checked-in) *</label>
              <select className="input" required value={createForm.reservation_id} onChange={e => setCreateForm(p => ({ ...p, reservation_id: e.target.value }))}>
                <option value="">Select reservation</option>
                {reservations.map(r => (
                  <option key={r.id} value={r.id}>#{r.id} — {r.first_name} {r.last_name} (Room {r.room_number})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Discount Amount ($)</label>
                <input type="number" step="0.01" min="0" className="input" value={createForm.discount_amount} onChange={e => setCreateForm(p => ({ ...p, discount_amount: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tax Rate</label>
                <select className="input" value={createForm.tax_rate} onChange={e => setCreateForm(p => ({ ...p, tax_rate: e.target.value }))}>
                  <option value={0}>0%</option>
                  <option value={0.05}>5%</option>
                  <option value={0.10}>10%</option>
                  <option value={0.15}>15%</option>
                  <option value={0.18}>18%</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Generate Invoice</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {showPayModal && (
        <Modal title="Record Payment" onClose={() => setShowPayModal(false)}>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="label">Amount *</label>
              <input type="number" step="0.01" min="0.01" className="input" required value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div>
              <label className="label">Payment Method *</label>
              <select className="input" value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="label">Reference Number</label>
              <input className="input" placeholder="Transaction / receipt number" value={payForm.reference_number} onChange={e => setPayForm(p => ({ ...p, reference_number: e.target.value }))} />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowPayModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Record Payment</button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Invoice Modal */}
      {viewInvoice && (
        <Modal title={`Invoice #${viewInvoice.id}`} onClose={() => setViewInvoice(null)} size="lg">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <p className="text-gray-500 text-xs">Guest</p>
                <p className="font-medium">{viewInvoice.first_name} {viewInvoice.last_name}</p>
                <p className="text-gray-500">{viewInvoice.email}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Stay</p>
                <p className="font-medium">Room {viewInvoice.room_number}</p>
                <p className="text-gray-500">{viewInvoice.check_in_date?.split('T')[0]} → {viewInvoice.check_out_date?.split('T')[0]}</p>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Line Items</p>
              <table className="w-full">
                <thead><tr className="text-xs text-gray-500 uppercase border-b"><th className="text-left py-1">Description</th><th className="text-right py-1">Qty</th><th className="text-right py-1">Unit</th><th className="text-right py-1">Total</th></tr></thead>
                <tbody>
                  {viewInvoice.items?.map(item => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2">{item.description}</td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">${parseFloat(item.unit_price).toFixed(2)}</td>
                      <td className="text-right py-2 font-medium">${parseFloat(item.total_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 text-right pt-2 border-t">
              <p className="text-gray-500">Subtotal: <span className="text-gray-900 font-medium">${parseFloat(viewInvoice.subtotal).toFixed(2)}</span></p>
              <p className="text-gray-500">Discount: <span className="text-gray-900 font-medium">-${parseFloat(viewInvoice.discount_amount).toFixed(2)}</span></p>
              <p className="text-gray-500">Tax ({(viewInvoice.tax_rate * 100).toFixed(0)}%): <span className="text-gray-900 font-medium">${parseFloat(viewInvoice.tax_amount).toFixed(2)}</span></p>
              <p className="text-lg font-bold">Total: ${parseFloat(viewInvoice.total_amount).toFixed(2)}</p>
              <StatusBadge status={viewInvoice.status} />
            </div>
            {viewInvoice.payments?.length > 0 && (
              <div>
                <p className="font-semibold text-gray-700 mb-2">Payments</p>
                {viewInvoice.payments.map(p => (
                  <div key={p.id} className="flex justify-between text-sm border-b py-1">
                    <span className="capitalize">{p.method} {p.reference_number && `(${p.reference_number})`}</span>
                    <span className="font-medium text-green-600">+${parseFloat(p.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            {viewInvoice.status !== 'paid' && (
              <div className="pt-2">
                <button onClick={() => { openPayForInvoice(viewInvoice); setViewInvoice(null); }} className="btn-primary w-full">Record Payment</button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
