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

import { Download, FileText, LogOut, Search } from "lucide-react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";

/* =======================
   TYPES
======================= */
type Learner = {
  id: string;
  name: string;
  email: string;
  status: string;
  score: number;
  hours_spent: number | null;
  attempts?: number;
};

type DashboardData = {
  metrics: {
    pass_mark: number;
    passed: number;
    failed: number;
    in_progress: number;
    enrolled: number;
    registered: number;
  };
  pieChart: { name: string; value: number }[];
  barChart: { label: string; value: number }[];
  learners: Learner[];
};

const COLORS = ["#16a34a", "#dc2626", "#2563eb", "#f59e0b", "#6b7280", "#8b5cf6"];

const API_URL =
  "https://renaissance.genzaar.app/wp-json/lp-dashboard/v2/analytics";

/* =======================
   COMPONENT
======================= */
export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [days, setDays] = useState("90");
  const [statusFilter, setStatusFilter] = useState("all");

  // NEW STATES
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const router = useRouter();

  /* =======================
     AUTH CHECK
  ======================= */
  useEffect(() => {
    axios
      .get(`/api/fetch-user`, { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => router.push("/login"));
  }, [router]);

  /* =======================
     FETCH DASHBOARD DATA
  ======================= */
  useEffect(() => {
    fetch(`${API_URL}?days=${days}`)
      .then((res) => res.json())
      .then((json: DashboardData) => setData(json))
      .catch(() => toast.error("Failed to fetch dashboard data"));
  }, [days]);

  /* =======================
     USE API DATA DIRECTLY
  ======================= */
  const learners = useMemo(() => data?.learners || [], [data]);

  /* =======================
     FILTERING
  ======================= */
  const filteredLearners = useMemo(() => {
    let list = learners;

    // status filter
    if (statusFilter !== "all") {
      list = list.filter((l) => l.status === statusFilter);
    }

    // search filter
    if (search.trim() !== "") {
      const query = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.email.toLowerCase().includes(query)
      );
    }

    return list;
  }, [learners, statusFilter, search]);

  /* =======================
     PAGINATION
  ======================= */
  const totalPages = Math.ceil(filteredLearners.length / perPage);

  const paginatedLearners = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredLearners.slice(start, start + perPage);
  }, [filteredLearners, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  /* =======================
     SUMMARY COUNTS
  ======================= */
  const registeredCount = learners.filter((l) => l.status === "registered").length;
  const enrolledCount = learners.filter((l) => l.status === "enrolled").length;
  const completedCount = learners.filter((l) => l.status === "completed").length;
  const inProgressCount = learners.filter((l) => l.status === "in_progress").length;
  const passedCount = learners.filter((l) => l.status === "passed").length;
  const failedCount = learners.filter((l) => l.status === "failed").length;

  /* =======================
     EXPORTS
  ======================= */
  const downloadCSV = () => {
    const csv = Papa.unparse(
      filteredLearners.map((l) => ({
        name: l.name,
        email: l.email,
        status: l.status,
        score: l.score,
        hours_spent: l.hours_spent ?? 0,
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
        `${l.score}%`,
        l.hours_spent ?? 0,
      ]),
    });

    doc.save("learners-report.pdf");
  };

  /* =======================
     LOGOUT
  ======================= */
  const handleLogout = async () => {
    try {
      await axios.post(`/api/log-out`, {}, { withCredentials: true });
      toast.success("Logged out successfully.");
      router.push("/login");
    } catch {
      toast.error("Failed to log out.");
    }
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">Renaissance Analytics Dashboard</h1>
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

      {/* Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Registered</p>
          <p className="text-2xl font-bold">{registeredCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Enrolled</p>
          <p className="text-2xl font-bold">{enrolledCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold">{completedCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold">{inProgressCount}</p>
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
          <div className="flex gap-2">
            <Search size={16} className="mt-2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="border px-3 py-2 rounded w-64"
            />
          </div>

          <select
            className="border px-3 py-2 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="registered">Registered</option>
            <option value="enrolled">Enrolled</option>
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
              <th>Attempts</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLearners.map((l, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{l.name}</td>
                <td>{l.email}</td>
                <td>
                  <span
                    className={`px-2 py-1 text-xs rounded font-semibold ${
                      l.status === "passed"
                        ? "bg-green-100 text-green-700"
                        : l.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {l.status.toUpperCase()}
                  </span>
                </td>
                <td>{l.score}%</td>
                <td>{l.attempts ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Prev
          </button>

          <div className="text-sm">
            Page {page} of {totalPages}
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
