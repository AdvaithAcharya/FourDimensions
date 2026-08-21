import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FileText, Image as ImageIcon, Video, Mic } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Theme colors matching AMOLED/glassmorphism
const MEDIA_CONFIG = {
  text: { label: 'Text Blocked', color: 'rgba(52, 211, 153, 1)', bg: 'rgba(52, 211, 153, 0.1)', icon: FileText },
  image: { label: 'Images Blocked', color: 'rgba(96, 165, 250, 1)', bg: 'rgba(96, 165, 250, 0.1)', icon: ImageIcon },
  audio: { label: 'Audio Sec Blocked', color: 'rgba(244, 114, 182, 1)', bg: 'rgba(244, 114, 182, 0.1)', icon: Mic },
  video: { label: 'Video Fr. Blocked', color: 'rgba(250, 204, 21, 1)', bg: 'rgba(250, 204, 21, 0.1)', icon: Video }
};

export default function MediaChartsGrid({ stats }) {
  const [chartData, setChartData] = useState({
    labels: Array.from({ length: 20 }, (_, i) => i.toString()),
    datasets: {
      text: Array(20).fill(0),
      image: Array(20).fill(0),
      audio: Array(20).fill(0),
      video: Array(20).fill(0)
    }
  });

  // Poll live backend ingestion
  useEffect(() => {
    if (!stats) return;

    setChartData(prev => {
      const newLabels = [...prev.labels.slice(1), new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" })];
      
      return {
        labels: newLabels,
        datasets: {
          text: [...prev.datasets.text.slice(1), stats.total_tokens_blocked || 0],
          image: [...prev.datasets.image.slice(1), stats.total_images_blocked || 0],
          audio: [...prev.datasets.audio.slice(1), stats.total_audio_blocked || 0],
          video: [...prev.datasets.video.slice(1), stats.total_video_blocked || 0]
        }
      };
    });
  }, [stats]);

  const buildChartProps = (mediaType) => {
    const config = MEDIA_CONFIG[mediaType];
    const data = {
      labels: chartData.labels,
      datasets: [
        {
          label: config.label,
          data: chartData.datasets[mediaType],
          borderColor: config.color,
          backgroundColor: config.bg,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 400,
        easing: 'linear'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { family: 'monospace', size: 11 },
          bodyFont: { family: 'monospace', size: 12 },
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          display: false,
          grid: { display: false }
        },
        y: {
          display: true,
          position: 'right',
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { family: 'monospace', size: 10 } },
          min: 0,
          suggestedMax: mediaType === 'text' ? 1000 : 20
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };

    return { data, options };
  };

  return (
    <div className="mt-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-2xl font-bold tracking-wide">MULTIMEDIA INGESTION</h3>
          <p className="text-gray-400 font-mono text-xs mt-1">Live timeseries tracking across multi-user & multi-platform (Placeholder)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(MEDIA_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const { data, options } = buildChartProps(key);
          
          return (
            <div key={key} className="glass-panel p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors group cursor-crosshair">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5" style={{ color: config.color }}>
                    <Icon size={18} />
                  </div>
                  <span className="font-mono text-sm font-semibold tracking-wider text-gray-300 group-hover:text-white transition-colors uppercase">
                    {config.label}
                  </span>
                </div>
                <div className="font-mono text-xs text-gray-500 animate-pulse">
                  LIVE
                </div>
              </div>
              <div className="h-48 w-full">
                <Line data={data} options={options} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
