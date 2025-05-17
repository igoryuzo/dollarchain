"use client";

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DepositAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [depositCounts, setDepositCounts] = useState<number[]>([]);
  const [totalDeposits, setTotalDeposits] = useState(0);

  useEffect(() => {
    async function fetchDepositAnalytics() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/analytics/deposits');
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        setLabels(data.labels);
        setDepositCounts(data.data);
        setTotalDeposits(data.totalDeposits);
      } catch (err) {
        console.error("Error fetching deposit analytics:", err);
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDepositAnalytics();
  }, []);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Deposits',
        data: depositCounts,
        borderColor: '#00C853',
        backgroundColor: 'rgba(0, 200, 83, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#00C853',
        pointRadius: 3,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0, // Ensures we only show whole numbers
        },
        title: {
          display: true,
          text: 'Number of Deposits',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time (by hour)',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            const index = items[0].dataIndex;
            return labels[index];
          },
        }
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-xl text-gray-500">Loading deposit analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-medium">
          Total deposits in last 48 hours: <span className="font-bold text-[#00C853]">{totalDeposits}</span>
        </div>
      </div>
      <Line options={chartOptions} data={chartData} />
    </div>
  );
} 