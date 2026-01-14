import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  FileDown,
  Download,
  Brain,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { HistoryRecord } from '../types/types';

// Mock Data Generation
const generateMockHistory = (): HistoryRecord[] => {
  const records: HistoryRecord[] = [];
  const baseDate = new Date();

  for (let i = 9; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);

    // Randomize some vitals
    const hr = 65 + Math.floor(Math.random() * 20); // 65-85
    const sys = 110 + Math.floor(Math.random() * 30); // 110-140
    const dia = 70 + Math.floor(Math.random() * 20); // 70-90

    let risk: 'Low' | 'Moderate' | 'High' = 'Low';
    let insight = 'Vitals stable. Good recovery.';

    if (sys > 135 || hr > 82) {
      risk = 'Moderate';
      insight = 'Elevated BP detected. Stress likely.';
    }
    if (sys > 150) {
      risk = 'High';
      insight = 'Hypertension warning. Seek care.';
    }

    records.push({
      id: i.toString(),
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      time: '09:00 AM',
      heartRate: hr,
      bloodPressure: `${sys}/${dia}`,
      riskLevel: risk,
      insight,
    });
  }
  return records;
};

const DATA = generateMockHistory();

// Chart Data Transformation
const CHART_DATA = DATA.map((r) => ({
  date: r.date,
  HR: r.heartRate,
  Systolic: parseInt(r.bloodPressure.split('/')[0]),
  Diastolic: parseInt(r.bloodPressure.split('/')[1]),
}));

const HistoryView: React.FC = () => {
  const handleDownload = (format: 'csv' | 'pdf') => {
    // Mock download
    alert(`Downloading medical_history_report.${format}...`);
  };

  const latest = DATA[DATA.length - 1];
  const avgHR = Math.round(
    DATA.reduce((acc, curr) => acc + curr.heartRate, 0) / DATA.length
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 p-2 md:p-0">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Latest Vitals */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Latest (Today)
            </span>
            <Activity className="text-blue-500" size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900">
              {latest.heartRate}
            </h3>
            <span className="text-sm text-slate-400">BPM</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
            <span className="font-semibold">{latest.bloodPressure}</span> mmHg
          </div>
        </div>

        {/* Avg Risk */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              10-Day Avg HR
            </span>
            <TrendingUp className="text-emerald-500" size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900">{avgHR}</h3>
            <span className="text-sm text-slate-400">BPM</span>
          </div>
          <p className="text-xs text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-1 rounded-full font-medium">
            Normal Range
          </p>
        </div>

        {/* AI Insight */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
              AI Trend Insight
            </span>
            <Brain className="text-white" size={18} />
          </div>
          <p className="text-sm font-medium leading-relaxed opacity-90">
            "Based on your last 10 logs, your resting heart rate has stabilized.
            Blood pressure spikes correlate with late-night entries."
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HR Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity size={18} className="text-rose-500" />
            Heart Rate Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="HR"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorHr)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BP Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            Blood Pressure History
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar dataKey="Systolic" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Diastolic" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-slate-500" />
            Past 10 Measurements
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleDownload('csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <FileDown size={14} /> CSV
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Download size={14} /> PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-900">
                  Date & Time
                </th>
                <th className="px-6 py-4 font-semibold text-slate-900">
                  Heart Rate
                </th>
                <th className="px-6 py-4 font-semibold text-slate-900">
                  BP (mmHg)
                </th>
                <th className="px-6 py-4 font-semibold text-slate-900">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold text-slate-900">
                  AI Insight
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DATA.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium">
                    {record.date}{' '}
                    <span className="text-slate-400 text-xs ml-1">
                      {record.time}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-slate-900">
                      {record.heartRate}
                    </span>{' '}
                    BPM
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-slate-900">
                      {record.bloodPressure}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        record.riskLevel === 'Low'
                          ? 'bg-emerald-100 text-emerald-700'
                          : record.riskLevel === 'Moderate'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {record.riskLevel === 'Low' ? (
                        <CheckCircle size={10} />
                      ) : (
                        <AlertTriangle size={10} />
                      )}
                      {record.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                    {record.insight}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
