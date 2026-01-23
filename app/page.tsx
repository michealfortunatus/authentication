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
  status: string;
  attempts: number;
  avg_score: number;
  hours_spent: number;
};

type DashboardData = {
  metrics: {
    pass_mark: number;
    avg_score: number;
    avg_hours_spent: number;
    attempts: number;
    passed: number;
    in_progress: number;
    first_attempt_pass: number;
    second_attempt_pass: number;
    avg_pass_score: number;
  };
  pieChart: { name: string; value: number }[];
  barChart: { label: string; value: number }[];
  learners: Learner[];
};

const COLORS = ["#2563eb", "#16a34a", "#eab308", "#f97316", "#dc2626"];

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
      .get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/fetch-user`, {
        withCredentials: true,
      })
      .then((res) => setUser(res.data.user))
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    fetch(`${API_URL}?days=${days}`)
      .then((res) => res.json())
      .then((json: DashboardData) => setData(json))
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
  head: [["Name", "Email", "Status", "Attempts", "Avg Score", "Hours Spent"]],
  body: filteredLearners.map((l) => [
    l.name,
    l.email,
    l.status,
    l.attempts,
    l.avg_score,
    l.hours_spent,
  ]),
});


    doc.save("learners-report.pdf");
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/log-out`,
        {},
        { withCredentials: true }
      );
      toast.success("Logged out successfully.");
      router.push("/login");
    } catch {
      toast.error("Failed to log out.");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">
          LearnPress Analytics Dashboard
        </h1>

        {/* Filter + Logout */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="border px-3 py-2 rounded w-full sm:w-auto"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          >
            <option value="90">Last 3 Months</option>
            <option value="7">Last Week</option>
            <option value="1">Last 24 Hours</option>
          </select>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full sm:w-auto"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Welcome */}
        <p className="text-sm text-gray-500">
          Welcome, {user?.email || "User"}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            title: "Avg Hours Spent",
            value: data?.metrics?.avg_hours_spent ?? "—",
          },
          {
            title: "Attempts",
            value: data?.metrics?.attempts ?? "—",
          },
        ].map((item, i) => (
          <div key={i} className="bg-white p-4 rounded shadow">
            <p className="text-gray-500 text-sm">{item.title}</p>
            <p className="text-2xl font-bold">{item.value}</p>
          </div>
        ))}
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <h2 className="font-semibold">Learners</h2>

            {/* Learner Filter */}
            <select
              className="border px-3 py-2 rounded w-full md:w-auto"
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
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={downloadCSV}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto"
            >
              <Download size={16} />
              Export CSV
            </button>

            <button
              onClick={downloadPDF}
              className="flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-2 rounded w-full sm:w-auto"
            >
              <FileText size={16} />
              Export PDF
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Avg Score</th>
              <th>Hours Spent</th>
            </tr>
          </thead>
          <tbody>
            {filteredLearners.map((l, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{l.name}</td>
                <td>{l.email}</td>
                <td>{l.status}</td>
                <td>{l.attempts}</td>
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
