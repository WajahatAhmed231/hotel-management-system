import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['available','occupied','reserved','cleaning','maintenance'];

const emptyForm = { room_number:'', floor:'', room_type_id:'', price_per_night:'', status:'available', notes:'' };

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [types, setTypes] = useState([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [r, t] = await Promise.all([api.get('/rooms'), api.get('/rooms/types')]);
      setRooms(r.data); setTypes(t.data);
    } catch { toast.error('Failed to load rooms'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (room) => { setEditing(room); setForm({ ...room, room_type_id: room.room_type_id || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/rooms/${editing.id}`, form);
        toast.success('Room updated');
      } else {
        await api.post('/rooms', form);
        toast.success('Room created');
      }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving room'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this room?')) return;
    try { await api.delete(`/rooms/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Cannot delete — room may have reservations'); }
  };

  const filtered = rooms.filter(r =>
    (!filter || r.room_number.includes(filter)) &&
    (!statusFilter || r.status === statusFilter)
  );

  const canEdit = ['admin','manager','receptionist'].includes(user?.role);
  const canDelete = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-500 text-sm">{rooms.length} total rooms</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Add Room
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search room number..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? <p className="text-center py-12 text-gray-400">Loading...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(room => (
            <div key={room.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xl font-bold text-gray-900">#{room.room_number}</p>
                  <p className="text-xs text-gray-500">Floor {room.floor} · {room.type_name || 'N/A'}</p>
                </div>
                <StatusBadge status={room.status} />
              </div>
              <p className="text-lg font-semibold text-blue-600">${room.price_per_night}<span className="text-xs text-gray-400">/night</span></p>
              {room.notes && <p className="text-xs text-gray-500 mt-1 truncate">{room.notes}</p>}
              {canEdit && (
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <button onClick={() => openEdit(room)} className="btn-secondary flex-1 flex items-center justify-center gap-1 text-sm py-1.5">
                    <PencilIcon className="w-4 h-4" /> Edit
                  </button>
                  {canDelete && (
                    <button onClick={() => handleDelete(room.id)} className="btn-danger flex items-center gap-1 text-sm py-1.5 px-3">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="col-span-full text-center py-12 text-gray-400">No rooms found</p>}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Room' : 'Add Room'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Room Number *</label>
                <input className="input" required value={form.room_number} onChange={e => setForm(p=>({...p,room_number:e.target.value}))} />
              </div>
              <div>
                <label className="label">Floor *</label>
                <input className="input" type="number" required value={form.floor} onChange={e => setForm(p=>({...p,floor:e.target.value}))} />
              </div>
              <div>
                <label className="label">Room Type *</label>
                <select className="input" required value={form.room_type_id} onChange={e => setForm(p=>({...p,room_type_id:e.target.value}))}>
                  <option value="">Select type</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.name} (${t.base_price})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Price/Night *</label>
                <input className="input" type="number" step="0.01" required value={form.price_per_night} onChange={e => setForm(p=>({...p,price_per_night:e.target.value}))} />
              </div>
              {editing && (
                <div className="col-span-2">
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm(p=>({...p,notes:e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Create Room'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
