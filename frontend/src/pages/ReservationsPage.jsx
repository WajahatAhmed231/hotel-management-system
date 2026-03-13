import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const emptyForm = { guest_id:'', room_id:'', check_in_date:'', check_out_date:'', num_guests:1, special_requests:'' };

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [res, g, r] = await Promise.all([
        api.get('/reservations', { params: { status: statusFilter || undefined } }),
        api.get('/guests'),
        api.get('/rooms'),
      ]);
      setReservations(res.data); setGuests(g.data); setRooms(r.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reservations', form);
      toast.success('Reservation created'); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this reservation?')) return;
    try { await api.put(`/reservations/${id}`, { status: 'cancelled' }); toast.success('Cancelled'); load(); }
    catch { toast.error('Failed to cancel'); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-500 text-sm">{reservations.length} total</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> New Reservation
        </button>
      </div>

      <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="">All statuses</option>
        {['pending','confirmed','checked_in','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['ID','Guest','Room','Check-in','Check-out','Guests','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : reservations.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No reservations found</td></tr>
              ) : reservations.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{r.id}</td>
                  <td className="px-4 py-3 font-medium">{r.first_name} {r.last_name}</td>
                  <td className="px-4 py-3">Room {r.room_number}</td>
                  <td className="px-4 py-3 text-gray-600">{r.check_in_date?.split('T')[0]}</td>
                  <td className="px-4 py-3 text-gray-600">{r.check_out_date?.split('T')[0]}</td>
                  <td className="px-4 py-3 text-center">{r.num_guests}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {!['cancelled','completed'].includes(r.status) && (
                      <button onClick={() => handleCancel(r.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="New Reservation" onClose={() => setShowModal(false)} size="lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Guest *</label>
                <select className="input" required value={form.guest_id} onChange={f('guest_id')}>
                  <option value="">Select guest</option>
                  {guests.map(g => <option key={g.id} value={g.id}>{g.first_name} {g.last_name} - {g.phone}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Room *</label>
                <select className="input" required value={form.room_id} onChange={f('room_id')}>
                  <option value="">Select room</option>
                  {rooms.filter(r => r.status === 'available').map(r => (
                    <option key={r.id} value={r.id}>Room {r.room_number} - {r.type_name} (${r.price_per_night}/night)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Check-in Date *</label>
                <input type="date" className="input" required value={form.check_in_date} onChange={f('check_in_date')} />
              </div>
              <div>
                <label className="label">Check-out Date *</label>
                <input type="date" className="input" required value={form.check_out_date} onChange={f('check_out_date')} />
              </div>
              <div>
                <label className="label">Number of Guests</label>
                <input type="number" min="1" className="input" value={form.num_guests} onChange={f('num_guests')} />
              </div>
              <div className="col-span-2">
                <label className="label">Special Requests</label>
                <textarea className="input" rows={2} value={form.special_requests} onChange={f('special_requests')} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Reservation</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
