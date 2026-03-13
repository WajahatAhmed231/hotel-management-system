import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const defaultStart = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
const defaultEnd = fmt(today);

export default function ReportsPage() {
  const [tab, setTab] = useState('occupancy');
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setData(null);
    try {
      const endpoints = { occupancy: '/reports/occupancy', revenue: '/reports/revenue', bookings: '/reports/bookings' };
      const res = await api.get(endpoints[tab], { params: { start, end } });
      setData(res.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const TABS = [
    { key: 'occupancy', label: 'Occupancy' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'bookings', label: 'Bookings' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm">Performance insights and data exports</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Date filters */}
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className="label">From</label>
          <input type="date" className="input w-auto" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input w-auto" value={end} onChange={e => setEnd(e.target.value)} />
        </div>
        <button onClick={load} className="btn-primary">Apply Filter</button>
      </div>

      {loading && <div className="text-center py-16 text-gray-400">Loading report...</div>}

      {/* Occupancy Report */}
      {!loading && data && tab === 'occupancy' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Daily Occupancy</h3>
            {data.data?.length === 0 ? <p className="text-gray-400 text-sm">No data for this period</p> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="rooms_occupied" fill="#3b82f6" name="Rooms Occupied" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Date', 'Reservations', 'Rooms Occupied', 'Occupancy %'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data?.map(row => (
                  <tr key={row.date} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{row.date}</td>
                    <td className="px-4 py-2">{row.reservations}</td>
                    <td className="px-4 py-2">{row.rooms_occupied}</td>
                    <td className="px-4 py-2 font-medium">{data.total_rooms ? ((row.rooms_occupied / data.total_rooms) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Report */}
      {!loading && data && tab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {data.summary?.map(s => (
              <div key={s.method} className="card text-center">
                <p className="text-2xl font-bold text-gray-900">${parseFloat(s.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-gray-500 capitalize mt-1">{s.method} payments</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Daily Revenue</h3>
            {data.data?.length === 0 ? <p className="text-gray-400 text-sm">No revenue data for this period</p> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={
                  [...new Set(data.data.map(d => d.date))].map(date => ({
                    date,
                    total: data.data.filter(d => d.date === date).reduce((s, d) => s + parseFloat(d.total), 0)
                  }))
                }>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
                  <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Bookings Report */}
      {!loading && data && tab === 'bookings' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['ID', 'Guest', 'Room', 'Check-in', 'Check-out', 'Guests', 'Status', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0
                  ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">No bookings in this period</td></tr>
                  : data.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500">#{r.id}</td>
                      <td className="px-4 py-2 font-medium">{r.first_name} {r.last_name}</td>
                      <td className="px-4 py-2">{r.room_number}</td>
                      <td className="px-4 py-2">{r.check_in_date?.split('T')[0]}</td>
                      <td className="px-4 py-2">{r.check_out_date?.split('T')[0]}</td>
                      <td className="px-4 py-2 text-center">{r.num_guests}</td>
                      <td className="px-4 py-2 capitalize">{r.status?.replace('_', ' ')}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
