"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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

import { Download, FileText, LogOut } from "lucide-react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";

type Learner = {
  id: number;
  name: string;
  email: string;
  status: "passed" | "failed";
  score: number;
  hours_spent: number;
};

type DashboardData = {
  metrics: {
    pass_mark: number;
    avg_score: number;
    avg_hours_spent: number;
    enrolled: number;
    passed: number;
    failed: number;
  };
  pieChart: { name: string; value: number }[];
  barChart: { label: string; value: number }[];
  learners: Learner[];
};

const COLORS = ["#16a34a", "#dc2626"];

const API_URL =
  "https://renaissance.genzaar.app/wp-json/lp-dashboard/v2/analytics";

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState("90");
  const [statusFilter, setStatusFilter] = useState("all");

  const router = useRouter();

  useEffect(() => {
    axios
      .get(`/api/fetch-user`, { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    fetch(`${API_URL}?days=${days}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => toast.error("Failed to fetch dashboard data"));
  }, [days]);

  const filteredLearners = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "all") return data.learners;
    return data.learners.filter((l) => l.status === statusFilter);
  }, [data, statusFilter]);

  const downloadCSV = () => {
    const csv = Papa.unparse(filteredLearners);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "learners.csv";
    a.click();
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Learners Report", 14, 16);

    (doc as any).autoTable({
      startY: 24,
      head: [["Name", "Email", "Status", "Score (%)", "Hours Spent"]],
      body: filteredLearners.map((l) => [
        l.name,
        l.email,
        l.status,
        l.score,
        l.hours_spent,
      ]),
    });

    doc.save("learners-report.pdf");
  };

  const handleLogout = async () => {
    try {
      await axios.post(`/api/log-out`, {}, { withCredentials: true });
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">LearnPress Analytics Dashboard</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="border px-3 py-2 rounded"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          >
            <option value="90">Last 3 Months</option>
            <option value="7">Last Week</option>
            <option value="1">Last 24 Hours</option>
          </select>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Welcome, {user?.email || "User"}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric title="Pass Mark" value={`${data?.metrics.pass_mark ?? 0}%`} />
        <Metric title="Avg Score" value={`${data?.metrics.avg_score ?? 0}%`} />
        <Metric
          title="Avg Hours Spent"
          value={data?.metrics.avg_hours_spent ?? 0}
        />
        <Metric title="Total Enrolled" value={data?.metrics.enrolled ?? 0} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChartBox title="Learner Status (Pie)">
          <PieChart>
            <Pie
              data={data?.pieChart || []}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
            >
              {(data?.pieChart || []).map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartBox>

        <ChartBox title="Learner Status (Bar)">
          <BarChart data={data?.barChart || []}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ChartBox>
      </div>

      {/* Learners */}
      <div className="bg-white p-6 rounded shadow space-y-4">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex gap-4 items-center">
            <h2 className="font-semibold">Learners</h2>
            <select
              className="border px-3 py-2 rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
            >
              <Download size={16} /> CSV
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded"
            >
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex gap-6 text-sm">
          <span>Total: {data?.metrics.enrolled ?? 0}</span>
          <span className="text-green-600">
            Passed: {data?.metrics.passed ?? 0}
          </span>
          <span className="text-red-600">
            Failed: {data?.metrics.failed ?? 0}
          </span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Score (%)</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {filteredLearners.map((l) => (
              <tr key={l.id} className="border-b">
                <td className="py-2">{l.name}</td>
                <td>{l.email}</td>
                <td
                  className={
                    l.status === "passed"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {l.status}
                </td>
                <td>{l.score}%</td>
                <td>{l.hours_spent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Helpers */
function Metric({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ChartBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded shadow h-80">
      <h2 className="font-semibold mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
