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
  id: string;
  name: string;
  email: string;
  avg_score: number;
  hours_spent: number;
};

type DashboardData = {
  metrics: {
    pass_mark: number;
  };
  pieChart: { name: string; value: number }[];
  barChart: { label: string; value: number }[];
  learners: Learner[];
};

const PASS_MARK = 80;

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
      .then((json: DashboardData) => setData(json))
      .catch(() => toast.error("Failed to fetch dashboard data"));
  }, [days]);

  /** 👇 Compute status on frontend */
  const learnersWithStatus = useMemo(() => {
    if (!data) return [];
    return data.learners.map((l) => ({
      ...l,
      status: l.avg_score >= PASS_MARK ? "passed" : "failed",
    }));
  }, [data]);

  /** 👇 Filtering */
  const filteredLearners = useMemo(() => {
    if (statusFilter === "all") return learnersWithStatus;
    return learnersWithStatus.filter((l) => l.status === statusFilter);
  }, [learnersWithStatus, statusFilter]);

  /** 👇 Summary counts */
  const totalStudents = learnersWithStatus.length;
  const passedCount = learnersWithStatus.filter(
    (l) => l.status === "passed"
  ).length;
  const failedCount = learnersWithStatus.filter(
    (l) => l.status === "failed"
  ).length;

  const downloadCSV = () => {
    const csv = Papa.unparse(
      filteredLearners.map((l) => ({
        name: l.name,
        email: l.email,
        status: l.status,
        score: l.avg_score,
        hours_spent: l.hours_spent,
      }))
    );
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
      head: [["Name", "Email", "Status", "Score", "Hours Spent"]],
      body: filteredLearners.map((l) => [
        l.name,
        l.email,
        l.status.toUpperCase(),
        `${l.avg_score}%`,
        l.hours_spent,
      ]),
    });

    doc.save("learners-report.pdf");
  };

  const handleLogout = async () => {
    try {
      await axios.post(`/api/log-out`, {}, { withCredentials: true });
      toast.success("Logged out successfully.");
      router.push("/login");
    } catch {
      toast.error("Failed to log out.");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">LearnPress Analytics Dashboard</h1>
      <p className="text-sm text-gray-500">Welcome, {user?.email}</p>

      {/* Controls */}
      <div className="flex gap-3">
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

      {/* Learners Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Total Enrolled</p>
          <p className="text-2xl font-bold">{totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Passed</p>
          <p className="text-2xl font-bold text-green-600">{passedCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-600">{failedCount}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        <div className="flex justify-between mb-4">
          <select
            className="border px-3 py-2 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="registered">Registered</option>
            <option value="enrolled">Enrolled</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={downloadCSV}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              <Download size={16} /> CSV
            </button>
            <button
              onClick={downloadPDF}
              className="bg-gray-800 text-white px-4 py-2 rounded"
            >
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Score</th>
              <th>Hours Spent</th>
            </tr>
          </thead>
          <tbody>
            {filteredLearners.map((l, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{l.name}</td>
                <td>{l.email}</td>
                <td>
                  <span
                    className={`px-2 py-1 text-xs rounded font-semibold ${
                      l.status === "passed"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {l.status.toUpperCase()}
                  </span>
                </td>
                <td>{l.avg_score}%</td>
                <td>{l.hours_spent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
