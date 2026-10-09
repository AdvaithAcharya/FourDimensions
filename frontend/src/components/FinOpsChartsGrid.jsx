import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Users, Layers, Cpu, TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function FinOpsChartsGrid({ currency = 'USD', refreshSignal = 0 }) {
  const [teamData, setTeamData] = useState([]);
  const [modelData, setModelData] = useState([]);
  const [featureData, setFeatureData] = useState([]);
  const [timeseries, setTimeseries] = useState({ labels: [], cost_series: [], token_series: [] });
  const [timeWindow, setTimeWindow] = useState('all');

  const fetchBreakdowns = useCallback(async () => {
    try {
      const [teamRes, modelRes, featRes, timeRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/finops/breakdown?group_by=team&time_window=${timeWindow}&currency=${currency}`),
        fetch(`http://127.0.0.1:8000/api/finops/breakdown?group_by=model&time_window=${timeWindow}&currency=${currency}`),
        fetch(`http://127.0.0.1:8000/api/finops/breakdown?group_by=feature&time_window=${timeWindow}&currency=${currency}`),
        fetch(`http://127.0.0.1:8000/api/finops/timeseries?limit=15&currency=${currency}`)
      ]);

      if (teamRes.ok) setTeamData(await teamRes.json());
      if (modelRes.ok) setModelData(await modelRes.json());
      if (featRes.ok) setFeatureData(await featRes.json());
      if (timeRes.ok) setTimeseries(await timeRes.json());
    } catch (e) {
      console.error("FinOps chart fetch error", e);
    }
  }, [currency, timeWindow]);

  useEffect(() => {
    fetchBreakdowns();
    const interval = setInterval(fetchBreakdowns, 2000);
    return () => clearInterval(interval);
  }, [fetchBreakdowns, refreshSignal]);

  // Chart 1: Spend by Team (Bar)
  const teamChartData = {
    labels: teamData.map(t => t.key),
    datasets: [
      {
        label: `Spend (${currency})`,
        data: teamData.map(t => t.total_cost_usd),
        backgroundColor: 'rgba(232, 96, 46, 0.75)',
        borderColor: 'rgba(232, 96, 46, 1)',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  // Chart 2: Model Share (Doughnut)
  const modelChartData = {
    labels: modelData.map(m => m.key),
    datasets: [
      {
        data: modelData.map(m => m.total_cost_usd),
        backgroundColor: [
          'rgba(232, 96, 46, 0.85)',
          'rgba(96, 165, 250, 0.85)',
          'rgba(167, 139, 250, 0.85)',
          'rgba(52, 211, 153, 0.85)',
          'rgba(251, 191, 36, 0.85)',
          'rgba(244, 114, 182, 0.85)'
        ],
        borderWidth: 1,
        borderColor: '#0f0f13'
      }
    ]
  };

  // Chart 3: Top Features by Cost (Horizontal Bar)
  const featureChartData = {
    labels: featureData.slice(0, 5).map(f => f.key),
    datasets: [
      {
        label: `Cost (${currency})`,
        data: featureData.slice(0, 5).map(f => f.total_cost_usd),
        backgroundColor: 'rgba(96, 165, 250, 0.7)',
        borderColor: 'rgba(96, 165, 250, 1)',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  // Chart 4: Cumulative Spend Over Time (Line)
  const timeseriesChartData = {
    labels: timeseries.labels,
    datasets: [
      {
        label: `Cumulative Spend (${currency})`,
        data: timeseries.cost_series,
        borderColor: 'rgba(52, 211, 153, 1)',
        backgroundColor: 'rgba(52, 211, 153, 0.15)',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 2
      }
    ]
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: { family: 'monospace', size: 11 },
        bodyFont: { family: 'monospace', size: 12 },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { family: 'monospace', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { family: 'monospace', size: 10 } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { family: 'monospace', size: 10 },
          boxWidth: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: { family: 'monospace', size: 11 },
        bodyFont: { family: 'monospace', size: 12 }
      }
    }
  };

  return (
    <div className="mt-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="font-display text-2xl font-bold tracking-wide flex items-center gap-3">
            <TrendingUp className="text-ember" />
            FINOPS MULTI-DIMENSIONAL BREAKDOWNS
          </h3>
          <p className="text-gray-400 font-mono text-xs mt-1">Real-time cost attribution by Team, Feature, Model, and Time trajectory</p>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-1 self-start md:self-auto">
          {[
            { id: 'all', label: 'All Time' },
            { id: '24h', label: 'Past 24h' },
            { id: '1h', label: 'Past 1h' }
          ].map(w => (
            <button
              key={w.id}
              onClick={() => setTimeWindow(w.id)}
              className={`px-3 py-1 font-mono text-xs rounded transition-all ${
                timeWindow === w.id
                  ? 'bg-ember/20 text-ember border border-ember/40 shadow-sm font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Team Spend */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 hover:border-ember/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/40 text-ember border border-white/5">
                <Users size={18} />
              </div>
              <span className="font-mono text-sm font-semibold tracking-wider text-gray-200 uppercase">
                Spend by Team
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Dimension: Team</span>
          </div>
          <div className="h-60 w-full">
            <Bar data={teamChartData} options={commonOptions} />
          </div>
        </div>

        {/* Panel 2: Model Distribution */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 hover:border-ember/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/40 text-blue-400 border border-white/5">
                <Cpu size={18} />
              </div>
              <span className="font-mono text-sm font-semibold tracking-wider text-gray-200 uppercase">
                Model Cost Distribution
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Pricing Table</span>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <Doughnut data={modelChartData} options={doughnutOptions} />
          </div>
        </div>

        {/* Panel 3: Feature Breakdown */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 hover:border-ember/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/40 text-purple-400 border border-white/5">
                <Layers size={18} />
              </div>
              <span className="font-mono text-sm font-semibold tracking-wider text-gray-200 uppercase">
                Top Features by Cost
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Dimension: Feature</span>
          </div>
          <div className="h-60 w-full">
            <Bar data={featureChartData} options={commonOptions} />
          </div>
        </div>

        {/* Panel 4: Spend Velocity */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 hover:border-ember/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/40 text-emerald-400 border border-white/5">
                <TrendingUp size={18} />
              </div>
              <span className="font-mono text-sm font-semibold tracking-wider text-gray-200 uppercase">
                Cumulative Spend Over Time
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Stream
            </span>
          </div>
          <div className="h-60 w-full">
            <Line data={timeseriesChartData} options={commonOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
