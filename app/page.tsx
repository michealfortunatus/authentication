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

type Learner = {
  id: string;
  name: string;
  email: string;
  status: string;
  score: number;
  hours_spent: number | null;
  attempts?: number;
  // 🔹 ADD (dynamic fields from API)
progress_percentage?: number;
last_activity?: string;

};

type RegisteredResponse = {
  metrics: {
    pass_mark: number;
    passed: number;
    failed: number;
    in_progress: number;
    enrolled: number;
    registered: number;
  };
  learners: Learner[];
};

type EnrolledResponse = {
  metrics: {
    total_students: number;
    passed: number;
    failed: number;
    inprogress: number;
    pass_mark: number;
  };
  learners: Learner[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

const COLORS = ["#16a34a", "#dc2626", "#2563eb", "#f59e0b"];

const REGISTERED_API =
  "https://renaissance.genzaar.app/wp-json/lp-dashboard/v2/registered";

const ENROLLED_API =
  "https://renaissance.genzaar.app/wp-json/lp-dashboard/v2/enrolled";

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);

  const [registeredData, setRegisteredData] =
    useState<RegisteredResponse | null>(null);
  const [enrolledData, setEnrolledData] = useState<EnrolledResponse | null>(
    null
  );

  const [days, setDays] = useState("90");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const perPage = 20;
  const router = useRouter();

  useEffect(() => {
    axios
      .get(`/api/fetch-user`, { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    fetch(`${REGISTERED_API}?page=1&per_page=1`)
      .then((res) => res.json())
      .then((json: RegisteredResponse) => setRegisteredData(json))
      .catch(() => toast.error("Failed to fetch registered data"));
  }, []);

  useEffect(() => {
    const url = `${ENROLLED_API}?page=${page}&per_page=${perPage}&status=${statusFilter}&search=${encodeURIComponent(
      search
    )}`;

    fetch(url)
      .then((res) => res.json())
      .then((json: EnrolledResponse) => setEnrolledData(json))
      .catch(() => toast.error("Failed to fetch enrolled data"));
  }, [page, statusFilter, search]);

  const inprogressCount = enrolledData?.metrics.inprogress ?? 0;
  const enrolledCount = enrolledData?.metrics.total_students ?? 0;


  const passedCount = enrolledData?.metrics.passed ?? 0;
  const failedCount = enrolledData?.metrics.failed ?? 0;

  const learners = useMemo(() => enrolledData?.learners || [], [enrolledData]);

  const totalPages = enrolledData?.pagination.total_pages ?? 1;

  const downloadCSV = () => {
    const csv = Papa.unparse(
      learners.map((l) => ({
        name: l.name,
        email: l.email,
        status: l.status,
        score: l.score,
        hours_spent: l.hours_spent ?? 0,
        attempts: l.attempts ?? 0,
        // 🔹 ADD
    progress_percentage: l.progress_percentage ?? 0,
    last_activity: l.last_activity ?? "",
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
      head: [["Name", "Email", "Status", "Score", "Hours Spent", "Attempts","Completion %", "Last Activity"]],
      body: learners.map((l) => [
        l.name,
        l.email,
        l.status.toUpperCase(),
        `${l.score}%`,
        l.hours_spent ?? 0,
        l.attempts ?? 0,
        // 🔹 ADD
  `${l.progress_percentage ?? 0}%`,
  l.last_activity ?? "-",
      ]),
    });

    doc.save("learners-report.pdf");
  };

  const chartData = [
    { name: "Inprogress", value: inprogressCount },
    { name: "Enrolled", value: enrolledCount },
    { name: "Passed", value: passedCount },
    { name: "Failed", value: failedCount },
  ];

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
      <h1 className="text-2xl font-bold">Renaissance Analytics Dashboard</h1>
      <p className="text-sm text-gray-500">Welcome, {user?.email}</p>

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
<div className="grid grid-cols-2 md:grid-cols-5 gap-4">


  <div className="bg-white p-4 rounded shadow">
    <p className="text-sm text-gray-500">Enrolled</p>
    <p className="text-2xl font-bold">{enrolledCount}</p>
  </div>

  <div className="bg-white p-4 rounded shadow">
    <p className="text-sm text-gray-500">In Progress</p>
    <p className="text-2xl font-bold">{inprogressCount}</p>
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


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded shadow h-80">
  <h2 className="font-semibold mb-4">Learner Status (Pie)</h2>

  <div className="h-[240px]"> {/* ✅ FIX */}
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          outerRadius={90}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
</div>


        <div className="bg-white p-6 rounded shadow h-80">
  <h2 className="font-semibold mb-4">Learner Status (Bar)</h2>

  <div className="h-[240px]"> {/* ✅ FIX */}
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

      </div>

      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            {/* <Search size={16} className="mt-2" /> */}
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or email..."
              className="border px-3 py-2 rounded w-64"
            />
          </div>

          <select
            className="border px-3 py-2 rounded"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Enrolled</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="inprogress">Inprogress</option>

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
              <th>Completion %</th>
              <th>Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {learners.map((l, i) => (
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
                <td>{l.score}%</td>
                <td>{l.attempts ?? 0}</td>
                <td>{l.progress_percentage ?? 0}%</td>
                <td>{l.last_activity ?? "-"}</td>

              </tr>
            ))}
          </tbody>
        </table>

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
