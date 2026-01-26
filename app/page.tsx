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

/* ================= TYPES ================= */

type Learner = {
  id: string;
  name: string;
  email: string;
  status: "passed" | "failed" | "in_progress";
  score: number;

  attempts: number;
  time_spent: number; // seconds
  progress_percentage: number;
  last_activity: string;
};

type RegisteredResponse = {
  metrics: {
    registered: number;
  };
};

type EnrolledResponse = {
  metrics: {
    passed: number;
    failed: number;
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

/* ================= CONSTANTS ================= */

const COLORS = ["#2563eb", "#16a34a", "#dc2626"];

const REGISTERED_API =
  "https://renaissance.genzaar.app/wp-json/lp-dashboard/v2/registered";

const ENROLLED_API =
  "https://renaissance.genzaar.app/wp-json/lp-dashboard/v2/enrolled";

/* ================= HELPERS ================= */

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

/* ================= COMPONENT ================= */

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<{ email: string } | null>(null);
  const [registeredData, setRegisteredData] =
    useState<RegisteredResponse | null>(null);
  const [enrolledData, setEnrolledData] =
    useState<EnrolledResponse | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const perPage = 20;

  /* ================= AUTH ================= */

  useEffect(() => {
    axios
      .get("/api/fetch-user", { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => router.push("/login"));
  }, [router]);

  /* ================= REGISTERED ================= */

  useEffect(() => {
    fetch(`${REGISTERED_API}`)
      .then((res) => res.json())
      .then(setRegisteredData)
      .catch(() => toast.error("Failed to fetch registered data"));
  }, []);

  /* ================= ENROLLED ================= */

  useEffect(() => {
    const url = `${ENROLLED_API}?page=${page}&per_page=${perPage}&status=${statusFilter}&search=${encodeURIComponent(
      search
    )}`;

    fetch(url)
      .then((res) => res.json())
      .then(setEnrolledData)
      .catch(() => toast.error("Failed to fetch enrolled data"));
  }, [page, statusFilter, search]);

  /* ================= METRICS ================= */

  const registeredCount = registeredData?.metrics.registered ?? 0;
  const passedCount = enrolledData?.metrics.passed ?? 0;
  const failedCount = enrolledData?.metrics.failed ?? 0;

  // IMPORTANT: enrolled = passed + failed
  const enrolledCount = passedCount + failedCount;

  const learners = useMemo(
    () => enrolledData?.learners ?? [],
    [enrolledData]
  );

  const totalPages = enrolledData?.pagination.total_pages ?? 1;

  /* ================= EXPORTS ================= */

  const downloadCSV = () => {
    const csv = Papa.unparse(
      learners.map((l) => ({
        name: l.name,
        email: l.email,
        status: l.status,
        score: l.score,
        attempts: l.attempts,
        progress_percentage: l.progress_percentage,
        time_spent_seconds: l.time_spent,
        last_activity: l.last_activity,
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
      head: [
        [
          "Name",
          "Email",
          "Status",
          "Score",
          "Attempts",
          "Completion %",
          "Last Activity",
        ],
      ],
      body: learners.map((l) => [
        l.name,
        l.email,
        l.status.toUpperCase(),
        `${l.score}%`,
        l.attempts,
        `${l.progress_percentage}%`,
        l.last_activity,
      ]),
    });

    doc.save("learners-report.pdf");
  };

  /* ================= CHART ================= */

  const chartData = [
    { name: "Registered", value: registeredCount },
    { name: "Enrolled", value: enrolledCount },
    { name: "Passed", value: passedCount },
    { name: "Failed", value: failedCount },
  ];

  /* ================= LOGOUT ================= */

  const handleLogout = async () => {
    await axios.post("/api/log-out", {}, { withCredentials: true });
    router.push("/login");
  };

  /* ================= UI ================= */

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <h1 className="text-2xl font-bold">Renaissance Analytics Dashboard</h1>
      <p className="text-sm text-gray-500">Welcome, {user?.email}</p>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Summary title="Registered" value={registeredCount} />
        <Summary title="Enrolled" value={enrolledCount} />
        <Summary title="Passed" value={passedCount} green />
        <Summary title="Failed" value={failedCount} red />
      </div>

      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-6">
        <ChartBox title="Learner Status (Pie)">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartBox>

        <ChartBox title="Learner Status (Bar)">
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ChartBox>
      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between mb-4">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or email..."
            className="border px-3 py-2 rounded w-64"
          />

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
          </select>

          <div className="flex gap-2">
            <button onClick={downloadCSV} className="btn-blue">
              <Download size={16} /> CSV
            </button>
            <button onClick={downloadPDF} className="btn-dark">
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Score</th>
              <th>Attempts</th>
              <th>Completion</th>
              <th>Time Spent</th>
              <th>Last Activity</th>
            </tr>
          </thead>

          <tbody>
            {learners.map((l) => (
              <tr key={l.id} className="border-b">
                <td>{l.name}</td>
                <td>{l.email}</td>
                <td>{l.status.toUpperCase()}</td>
                <td>{l.score}%</td>
                <td>{l.attempts}</td>
                <td>{l.progress_percentage}%</td>
                <td>{formatTime(l.time_spent)}</td>
                <td>{new Date(l.last_activity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex justify-between mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <button onClick={handleLogout} className="btn-red">
        <LogOut size={16} /> Logout
      </button>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Summary({
  title,
  value,
  green,
  red,
}: {
  title: string;
  value: number;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p
        className={`text-2xl font-bold ${
          green ? "text-green-600" : red ? "text-red-600" : ""
        }`}
      >
        {value}
      </p>
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
