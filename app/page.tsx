"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import Papa from "papaparse";

type ChartItem = {
  name: string;
  value: number;
};

type BarItem = {
  label: string;
  value: number;
};

type Learner = {
  name: string;
  email: string;
  status: string;
  attempts: number;
  avg_score: number;
};

type DashboardData = {
  metrics: {
    pass_mark: number;
    avg_score: number;
    passed: number;
    in_progress: number;
  };
  pieChart: ChartItem[];
  barChart: BarItem[];
  learners: Learner[];
};

const COLORS = ["#2563eb", "#16a34a", "#eab308", "#f97316", "#dc2626"];

const API_URL =
  "https://renaissance.genzaar.app/wp-json/lp-dashboard/v2/analytics";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState("90");

  useEffect(() => {
    fetch(`${API_URL}?days=${days}`)
      .then((res) => res.json())
      .then((json: DashboardData) => setData(json));
  }, [days]);

  const downloadCSV = () => {
    const csv = Papa.unparse(data?.learners || []);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "learners.csv";
    a.click();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">LearnPress Analytics Dashboard</h1>

        <select
          className="border px-3 py-2 rounded"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        >
          <option value="90">Last 3 Months</option>
          <option value="7">Last Week</option>
          <option value="1">Last 24 Hours</option>
        </select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            title: "Pass Mark",
            value: data?.metrics?.pass_mark ? `${data.metrics.pass_mark}%` : "—",
          },
          {
            title: "Avg Score",
            value: data?.metrics?.avg_score ? `${data.metrics.avg_score}%` : "—",
          },
          {
            title: "Passed",
            value: data?.metrics?.passed ?? "—",
          },
          {
            title: "In Progress",
            value: data?.metrics?.in_progress ?? "—",
          },
        ].map((item, i) => (
          <div key={i} className="bg-white p-4 rounded shadow">
            <p className="text-gray-500 text-sm">{item.title}</p>
            <p className="text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded shadow h-80">
          <h2 className="font-semibold mb-4">Learner Status (Pie)</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.pieChart || []}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
              >
                {(data?.pieChart || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded shadow h-80">
          <h2 className="font-semibold mb-4">Learner Status (Bar)</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.barChart || []}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Learners Table */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Learners</h2>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {(data?.learners || []).map((l, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{l.name}</td>
                <td>{l.email}</td>
                <td>{l.status}</td>
                <td>{l.attempts}</td>
                <td>{l.avg_score}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
