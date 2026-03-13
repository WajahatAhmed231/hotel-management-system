import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

const STATES = ['dirty', 'in_progress', 'clean'];

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stateFilter, setStateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ room_id: '', assigned_to: '', priority: 1, notes: '', cleaning_state: 'dirty', reported_issue: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [t, s, r] = await Promise.all([
        api.get('/housekeeping', { params: { state: stateFilter || undefined } }),
        api.get('/housekeeping/staff'),
        api.get('/rooms'),
      ]);
      setTasks(t.data); setStaff(s.data); setRooms(r.data);
    } catch { toast.error('Failed to load housekeeping data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [stateFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/housekeeping/${editing.id}`, form);
        toast.success('Task updated');
      } else {
        await api.post('/housekeeping', form);
        toast.success('Task created');
      }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const quickUpdate = async (id, cleaning_state) => {
    try {
      await api.put(`/housekeeping/${id}`, { cleaning_state });
      toast.success(`Marked as ${cleaning_state.replace('_', ' ')}`);
      load();
    } catch { toast.error('Update failed'); }
  };

  const stateColor = { dirty: 'bg-red-50 border-red-200', in_progress: 'bg-blue-50 border-blue-200', clean: 'bg-green-50 border-green-200' };

  const counts = { dirty: tasks.filter(t => t.cleaning_state === 'dirty').length, in_progress: tasks.filter(t => t.cleaning_state === 'in_progress').length, clean: tasks.filter(t => t.cleaning_state === 'clean').length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Housekeeping</h1>
          <p className="text-gray-500 text-sm">Room cleaning status and task management</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ room_id: '', assigned_to: '', priority: 1, notes: '', cleaning_state: 'dirty', reported_issue: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[['dirty', 'Dirty Rooms', 'bg-red-500'], ['in_progress', 'In Progress', 'bg-blue-500'], ['clean', 'Clean Rooms', 'bg-green-500']].map(([key, label, color]) => (
          <div key={key} className="card text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStateFilter(stateFilter === key ? '' : key)}>
            <div className={`text-3xl font-bold ${stateFilter === key ? 'text-blue-600' : 'text-gray-900'}`}>{counts[key]}</div>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <select className="input w-auto" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
          <option value="">All states</option>
          {STATES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {loading ? <p className="text-center py-12 text-gray-400">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.length === 0 ? (
            <p className="col-span-full text-center py-12 text-gray-400">No tasks found</p>
          ) : tasks.map(task => (
            <div key={task.id} className={`card border-2 ${stateColor[task.cleaning_state] || ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-lg">Room {task.room_number}</p>
                  <p className="text-xs text-gray-500">Floor {task.floor}</p>
                </div>
                <StatusBadge status={task.cleaning_state} />
              </div>
              {task.assigned_to_name && (
                <p className="text-sm text-gray-600 mb-1">👤 {task.assigned_to_name}</p>
              )}
              {task.notes && <p className="text-xs text-gray-500 mb-1">📝 {task.notes}</p>}
              {task.reported_issue && <p className="text-xs text-red-500 mb-2">⚠️ {task.reported_issue}</p>}
              <div className="flex gap-2 mt-3 pt-3 border-t flex-wrap">
                {task.cleaning_state === 'dirty' && (
                  <button onClick={() => quickUpdate(task.id, 'in_progress')} className="btn-secondary text-xs py-1.5 flex-1">Start Cleaning</button>
                )}
                {task.cleaning_state === 'in_progress' && (
                  <button onClick={() => quickUpdate(task.id, 'clean')} className="btn-primary text-xs py-1.5 flex-1">Mark Clean</button>
                )}
                {task.cleaning_state === 'clean' && (
                  <span className="text-xs text-green-600 font-medium py-1.5">✓ Completed</span>
                )}
                <button onClick={() => { setEditing(task); setForm({ ...task }); setShowModal(true); }} className="text-gray-500 hover:text-gray-700 py-1.5 px-2">
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Task' : 'New Housekeeping Task'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Room *</label>
              <select className="input" required value={form.room_id} onChange={e => setForm(p => ({ ...p, room_id: e.target.value }))}>
                <option value="">Select room</option>
                {rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number} (Floor {r.floor}) — {r.status}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assign to Staff</label>
              <select className="input" value={form.assigned_to || ''} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value || null }))}>
                <option value="">Unassigned</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {editing && (
              <div>
                <label className="label">Cleaning State</label>
                <select className="input" value={form.cleaning_state} onChange={e => setForm(p => ({ ...p, cleaning_state: e.target.value }))}>
                  {STATES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Priority (1 = low, 5 = urgent)</label>
              <input type="number" min="1" max="5" className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div>
              <label className="label">Reported Issue</label>
              <textarea className="input" rows={2} placeholder="Describe any maintenance issues..." value={form.reported_issue || ''} onChange={e => setForm(p => ({ ...p, reported_issue: e.target.value }))} />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Create Task'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
