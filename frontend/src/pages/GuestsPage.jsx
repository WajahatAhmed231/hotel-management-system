import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';

const emptyForm = { first_name:'', last_name:'', email:'', phone:'', address:'', id_type:'', id_number:'', nationality:'', notes:'' };

export default function GuestsPage() {
  const [guests, setGuests] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/guests', { params: { search } });
      setGuests(res.data);
    } catch { toast.error('Failed to load guests'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const openView = async (guest) => {
    try {
      const res = await api.get(`/guests/${guest.id}`);
      setViewing(res.data);
    } catch { toast.error('Failed to load guest details'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/guests/${editing.id}`, form); toast.success('Guest updated'); }
      else { await api.post('/guests', form); toast.success('Guest created'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving'); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guests</h1>
          <p className="text-gray-500 text-sm">Guest profiles and history</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Guest
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9 max-w-md" placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name','Phone','Email','Nationality','ID Number','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : guests.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No guests found</td></tr>
            ) : guests.map(g => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{g.first_name} {g.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{g.phone}</td>
                <td className="px-4 py-3 text-gray-600">{g.email || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{g.nationality || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{g.id_number || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openView(g)} className="text-blue-600 hover:text-blue-800"><EyeIcon className="w-4 h-4" /></button>
                    <button onClick={() => { setEditing(g); setForm(g); setShowModal(true); }} className="text-gray-500 hover:text-gray-700"><PencilIcon className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Guest' : 'New Guest'} onClose={() => setShowModal(false)} size="lg">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {[['first_name','First Name',true],['last_name','Last Name',true],['phone','Phone',true],['email','Email',false],['address','Address',false],['nationality','Nationality',false],['id_type','ID Type',false],['id_number','ID Number',false]].map(([key, label, req]) => (
              <div key={key}>
                <label className="label">{label}{req && ' *'}</label>
                <input className="input" required={req} value={form[key] || ''} onChange={f(key)} />
              </div>
            ))}
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes || ''} onChange={f('notes')} />
            </div>
            <div className="col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editing ? 'Save' : 'Create Guest'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Modal */}
      {viewing && (
        <Modal title={`${viewing.first_name} ${viewing.last_name}`} onClose={() => setViewing(null)} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Phone', viewing.phone], ['Email', viewing.email], ['Nationality', viewing.nationality], ['ID', `${viewing.id_type} ${viewing.id_number}`], ['Address', viewing.address]].map(([label, val]) => val && (
                <div key={label}>
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="font-medium text-gray-900">{val}</p>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Reservation History ({viewing.reservations?.length || 0})</h4>
              {viewing.reservations?.length === 0
                ? <p className="text-gray-400 text-sm">No reservations</p>
                : viewing.reservations?.map(r => (
                  <div key={r.id} className="flex justify-between items-center py-2 border-b text-sm">
                    <div>
                      <p className="font-medium">Room {r.room_number}</p>
                      <p className="text-gray-500 text-xs">{r.check_in_date} → {r.check_out_date}</p>
                    </div>
                    <span className="capitalize text-xs text-gray-600">{r.status}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
