import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { BuildingOfficeIcon, UsersIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const PIE_COLORS = { available: '#22c55e', occupied: '#ef4444', reserved: '#f59e0b', cleaning: '#3b82f6', maintenance: '#6b7280' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [todayActivity, setTodayActivity] = useState({ check_ins: [], check_outs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, today] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/reservations/today'),
        ]);
        setData(dash.data);
        setTodayActivity(today.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading dashboard...</div>;
  if (!data) return null;

  const roomPieData = Object.entries(data.rooms)
    .filter(([k]) => k !== 'total')
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Overview of today's hotel operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard icon={BuildingOfficeIcon} label="Total Rooms" value={data.rooms.total || 0} color="bg-gray-600" />
        <StatCard icon={BuildingOfficeIcon} label="Occupied" value={data.rooms.occupied || 0} color="bg-red-500" />
        <StatCard icon={BuildingOfficeIcon} label="Available" value={data.rooms.available || 0} color="bg-green-500" />
        <StatCard icon={ArrowDownTrayIcon} label="Check-ins Today" value={data.today_check_ins} color="bg-blue-500" />
        <StatCard icon={ArrowUpTrayIcon} label="Check-outs Today" value={data.today_check_outs} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue card */}
        <div className="card flex flex-col justify-between">
          <p className="text-sm text-gray-500 mb-1">Revenue Today</p>
          <p className="text-4xl font-bold text-gray-900">
            ${parseFloat(data.revenue_today || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <CurrencyDollarIcon className="w-8 h-8 text-green-400 mt-4" />
        </div>

        {/* Room status pie */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Room Status Breakdown</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={roomPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                  {roomPieData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#ccc'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {roomPieData.map(({ name, value }) => (
                <div key={name} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[name] || '#ccc' }} />
                  <span className="text-gray-600 capitalize">{name}</span>
                  <span className="font-bold text-gray-900 ml-auto pl-4">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Today's activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Today's Check-ins ({todayActivity.check_ins.length})</h3>
          {todayActivity.check_ins.length === 0
            ? <p className="text-gray-400 text-sm">No check-ins scheduled today</p>
            : <div className="space-y-2">
                {todayActivity.check_ins.map(r => (
                  <div key={r.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-gray-500">Room {r.room_number}</p>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Confirmed</span>
                  </div>
                ))}
              </div>
          }
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Today's Check-outs ({todayActivity.check_outs.length})</h3>
          {todayActivity.check_outs.length === 0
            ? <p className="text-gray-400 text-sm">No check-outs scheduled today</p>
            : <div className="space-y-2">
                {todayActivity.check_outs.map(r => (
                  <div key={r.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-gray-500">Room {r.room_number}</p>
                    </div>
                    <span className="text-xs text-orange-600 font-medium">Due Out</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
}
