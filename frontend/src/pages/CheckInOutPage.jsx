import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export default function CheckInOutPage() {
  const [tab, setTab] = useState('checkin');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const status = tab === 'checkin' ? 'confirmed' : 'checked_in';
      const res = await api.get('/reservations', { params: { status } });
      setReservations(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const handleCheckIn = async (id) => {
    try { await api.post(`/reservations/${id}/checkin`); toast.success('Guest checked in!'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Check-in failed'); }
  };

  const handleCheckOut = async (id) => {
    try { await api.post(`/reservations/${id}/checkout`); toast.success('Guest checked out!'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Check-out failed'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check-In / Check-Out</h1>
        <p className="text-gray-500 text-sm">Manage guest arrivals and departures</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'checkin', label: 'Check-In', icon: ArrowDownTrayIcon },
          { key: 'checkout', label: 'Check-Out', icon: ArrowUpTrayIcon },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {tab === 'checkin' ? <ArrowDownTrayIcon className="w-8 h-8 text-gray-400" /> : <ArrowUpTrayIcon className="w-8 h-8 text-gray-400" />}
          </div>
          <p className="text-gray-500 font-medium">No guests pending {tab === 'checkin' ? 'check-in' : 'check-out'}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reservations.map(r => (
            <div key={r.id} className="card flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                  {r.first_name?.[0]}{r.last_name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{r.first_name} {r.last_name}</p>
                  <p className="text-sm text-gray-500">{r.phone} · {r.email}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Room {r.room_number}</span>
                <span className="text-gray-400 mx-2">·</span>
                {r.check_in_date?.split('T')[0]} → {r.check_out_date?.split('T')[0]}
                <span className="text-gray-400 mx-2">·</span>
                {r.num_guests} guest(s)
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={r.status} />
                {tab === 'checkin' ? (
                  <button onClick={() => handleCheckIn(r.id)} className="btn-primary flex items-center gap-2">
                    <ArrowDownTrayIcon className="w-4 h-4" /> Check In
                  </button>
                ) : (
                  <button onClick={() => handleCheckOut(r.id)} className="btn-danger flex items-center gap-2">
                    <ArrowUpTrayIcon className="w-4 h-4" /> Check Out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
