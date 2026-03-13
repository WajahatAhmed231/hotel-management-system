import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

const ROLES = ['admin', 'manager', 'receptionist', 'housekeeping'];
const emptyForm = { name: '', email: '', password: '', role: 'receptionist', phone: '' };

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try { const res = await api.get('/staff'); setStaff(res.data); }
    catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/staff/${editing.id}`, form);
        toast.success('Staff updated');
      } else {
        await api.post('/auth/register', form);
        toast.success('Staff member created');
      }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving staff'); }
  };

  const toggleStatus = async (member) => {
    const action = member.is_active ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${member.name}?`)) return;
    try {
      await api.put(`/staff/${member.id}/${action}`);
      toast.success(`Account ${action}d`); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Action failed'); }
  };

  const roleColor = { admin: 'bg-purple-100 text-purple-700', manager: 'bg-blue-100 text-blue-700', receptionist: 'bg-green-100 text-green-700', housekeeping: 'bg-yellow-100 text-yellow-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 text-sm">{staff.length} team members</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : staff.map(member => (
              <tr key={member.id} className={`hover:bg-gray-50 ${!member.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
                      {member.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{member.email}</td>
                <td className="px-4 py-3 text-gray-600">{member.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${roleColor[member.role] || 'bg-gray-100 text-gray-600'}`}>{member.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(member.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(member); setForm({ name: member.name, email: member.email, phone: member.phone || '', role: member.role, password: '' }); setShowModal(true); }} className="text-gray-500 hover:text-gray-700">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleStatus(member)} className={`text-xs font-medium ${member.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                      {member.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Staff Member' : 'New Staff Member'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[['name', 'Full Name', 'text', true], ['email', 'Email', 'email', true], ['phone', 'Phone', 'tel', false]].map(([key, label, type, req]) => (
              <div key={key}>
                <label className="label">{label}{req && ' *'}</label>
                <input type={type} className="input" required={req} value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            {!editing && (
              <div>
                <label className="label">Password *</label>
                <input type="password" className="input" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Create Staff'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
