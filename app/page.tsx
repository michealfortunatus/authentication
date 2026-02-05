"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import AddAdminSection from "../components/AddAdminSection";
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
  Legend
} from "recharts";

import { Download, FileText, LogOut, Search } from "lucide-react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


type Department = {
  id: string;
  name: string;
};

type DepartmentOption = {
  id: string;
  name: string;
};

type CourseOption = {
  id: string;
  title: string;
};


type LearnerCourse = {
  course_id: string;
  course_title: string;
  status: string;
  graduation: string;
  start_time: string | null;
  end_time: string | null;
};


type Learner = {
  id: string;
  name: string;
  email: string;
  status: string;
  score: number;
  hours_spent: number | null;
  attempts?: number;
progress_percentage?: number;
last_activity?: string;
courses?: LearnerCourse[];
departments?: Department[];

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
    in_progress: number;
    pass_mark: number;
    average_score: number;
    average_pass_score: number;


  };
  learners: Learner[];
  departments: DepartmentOption[]; // ✅ added
  courses: CourseOption[];         // ✅ added

  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};
const SUPER_ADMIN_EMAIL = "demo@demo.com";

const COLORS = ["#f59e0b", "#2563eb",  "#16a34a","#dc2626", ];

const REGISTERED_API =
  "https://renaissance.genzaar.app/wp-json/lp-dashboard/v2/registered";

const ENROLLED_API =
  "https://renaissance.genzaar.app/wp-json/lp-dashboard/v2/enrolled";

export default function DashboardPage() {
const [newAdminEmail, setNewAdminEmail] = useState("");
const [addingAdmin, setAddingAdmin] = useState(false);

  const [user, setUser] = useState<{ email: string; role?: string } | null>(null);



  const [registeredData, setRegisteredData] =
    useState<RegisteredResponse | null>(null);
  const [enrolledData, setEnrolledData] = useState<EnrolledResponse | null>(
    null
  );

  const [days, setDays] = useState<number>(90);
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
    const url = `${ENROLLED_API}?page=${page}&per_page=${perPage}&status=${statusFilter}&days=${days}&search=${encodeURIComponent(
  search
)}`;


    fetch(url)
      .then((res) => res.json())
      .then((json: EnrolledResponse) => setEnrolledData(json))
      .catch(() => toast.error("Failed to fetch enrolled data"));
  }, [page, statusFilter, search, days]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");

  const inprogressCount = enrolledData?.metrics.in_progress ?? 0;
  const enrolledCount = enrolledData?.metrics.total_students ?? 0;

const averageScore = enrolledData?.metrics.average_score ?? 0;
const averagePassScore = enrolledData?.metrics.average_pass_score ?? 0;

  const passedCount = enrolledData?.metrics.passed ?? 0;
  const failedCount = enrolledData?.metrics.failed ?? 0;
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");
  const learners = useMemo(() => {
  let list = enrolledData?.learners || [];

  if (selectedCourseId !== "all") {
    list = list.filter((l) =>
      l.courses?.some((c) => c.course_id === selectedCourseId)
    );
  }

  if (selectedDepartmentId !== "all") {
    list = list.filter((l) =>
      l.departments?.some((d) => d.id === selectedDepartmentId)
    );
  }

  return list;
}, [enrolledData, selectedCourseId, selectedDepartmentId]);

const departmentChartData = useMemo(() => {
  const map: Record<string, { enrolled: number; in_progress: number; passed: number }> = {};

  learners.forEach((learner) => {
    learner.departments?.forEach((dept) => {
      if (!map[dept.name]) {
        map[dept.name] = { enrolled: 0, in_progress: 0, passed: 0 };
      }

      map[dept.name].enrolled += 1;

      if (learner.status === "passed") {
        map[dept.name].passed += 1;
      } else if (learner.status === "in_progress") {
        map[dept.name].in_progress += 1;
      }
    });
  });

  return Object.entries(map).map(([name, counts]) => ({
    name,
    ...counts,
  }));
}, [learners]);




const notStartedCount = useMemo(() => {
  return learners.filter(l =>
    !l.courses || l.courses.every(c => c.status === "not_started" || !c.status)
  ).length;
}, [learners]);
  const totalPages = enrolledData?.pagination.total_pages ?? 1;

  const combinedInProgressCount = useMemo(() => {
  return inprogressCount + notStartedCount + failedCount;
}, [inprogressCount, notStartedCount, failedCount]);



  const downloadCSV = () => {
    const csv = Papa.unparse(
      learners.map((l) => ({
        name: l.name,
        email: l.email,
        status: l.status,
        score: l.score,
        hours_spent: l.hours_spent ?? 0,
        attempts: l.attempts ?? 0,
        progress_percentage: l.progress_percentage ?? 0,
        last_activity: l.last_activity ?? "",
        courses: l.courses?.map((c) => c.course_title).join(", ") ?? ""
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

  autoTable(doc, {
    startY: 24,
    head: [[
      "Name",
      "Email",
      "Status",
      "Score",
      "Hours Spent",
      "Attempts",
      "Completion %",
      "Last Activity",
      "Courses",
      "Departments",
    ]],
    body: learners.map((l) => [
      l.name,
      l.email,
      l.status.replace("_", " ").toUpperCase(),
      `${l.score}%`,
      l.hours_spent ?? 0,
      l.attempts ?? 0,
      `${l.progress_percentage ?? 0}%`,
      l.last_activity ?? "-",
      l.courses?.map(c => c.course_title).join(", ") ?? "-",
      l.departments?.map(d => d.name).join(", ") ?? "-",
    ]),
  });

  doc.save("learners-report.pdf");
};


  // const chartData = [
  //   { name: "Inprogress", value: inprogressCount },
  //   { name: "Enrolled", value: enrolledCount },
  //   { name: "Passed", value: passedCount },
  //   { name: "Failed", value: failedCount },

  // ];



  const chartData = useMemo(() => [
  {
    name: "In Progress",
    value: combinedInProgressCount, // ✅ merged value
  },
  {
    name: "Passed",
    value: passedCount,
  },
  {
    name: "Enrolled",
    value: enrolledCount,
  },
], [combinedInProgressCount, passedCount, enrolledCount]);


  const handleLogout = async () => {
    try {
      await axios.post(`/api/log-out`, {}, { withCredentials: true });
      toast.success("Logged out successfully.");
      router.push("/login");
    } catch {
      toast.error("Failed to log out.");
    }
  };


  const handleAddAdmin = async () => {
    if (!newAdminEmail) {
      toast.error("Please enter an email");
      return;
    }

    try {
      setAddingAdmin(true);

      await axios.post(
        "/api/add-admin",
        { email: newAdminEmail },
        { withCredentials: true }
      );

      toast.success("Admin added successfully");
      setNewAdminEmail("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add admin");
    } finally {
      setAddingAdmin(false);
    }
  };

  // derive super admins from env at component scope (defined before JSX)
  const superAdmins = "demo@demo.com";
    (process.env.NEXT_PUBLIC_SUPER_ADMINS || process.env.SUPER_ADMINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  return (
    <>
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6">
      <h1 className="text-2xl font-bold">Renaissance Analytics Dashboard</h1>
      <p className="text-sm text-gray-500">Welcome, {user?.email}</p>
      {user && superAdmins.includes(user.email) && <AddAdminSection />}

      <div className="flex gap-3">
        <select
          value={days}
          onChange={(e) => {
            setDays(Number(e.target.value));
            setPage(1);
          }}
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
      <>
        <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Pass Mark</p>
            <p className="text-2xl font-bold">{enrolledData?.metrics.pass_mark ?? 80}%</p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Enrolled</p>
            <p className="text-2xl font-bold text-blue-600">{enrolledCount}</p>
          </div>

          {/* <div className="bg-white p-4 rounded shadow">
               <p className="text-sm text-gray-500">Not Started</p>
               <p className="text-2xl font-bold text-blue-600">{notStartedCount}</p>
          </div> */}


          <div className="bg-white p-4 rounded shadow">
               <p className="text-sm text-gray-500">In progress</p>
            <p className="text-2xl font-bold text-yellow-600">
  {combinedInProgressCount}
</p>

            {/* <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{inprogressCount}</p>
            <p className="text-sm text-gray-500">Not Started</p>
               <p className="text-2xl font-bold text-blue-600">{notStartedCount}</p>
                <p className="text-sm text-gray-500">Failed</p>
            <p className="text-2xl font-bold text-red-600">{failedCount}</p> */}
          </div>

          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Passed</p>
            <p className="text-2xl font-bold text-green-600">{passedCount}</p>
          </div>

          {/* <div className="bg-white p-4 rounded shadow">

          </div> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* <div className="bg-white p-6 rounded shadow h-80">
            <h2 className="font-semibold mb-4">Learner Status (Pie)</h2>

            <div className="h-[240px]">
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
          </div> */}

          <div className="bg-white p-6 rounded shadow h-80">
            <h2 className="font-semibold mb-4">Learner Status (Bar)</h2>

            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}
                 margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                 barCategoryGap="40%"   // space between categories
                barGap={6}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />

                  <Bar dataKey="value" barSize={28}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow h-80">
  <h2 className="font-semibold mb-4">Learners by Department</h2>

  <div className="h-[240px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={departmentChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend/>

        <Bar dataKey="enrolled" fill="#2563eb" width="75%" />
        <Bar dataKey="in_progress" fill="#f59e0b" width="75%" />
        <Bar dataKey="passed" fill="#16a34a" width="75%" />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>


        </div>

        <div className="bg-white p-6 rounded shadow">
          <div className="flex justify-between mb-4">
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name or email..."
                className="border px-3 py-2 rounded w-64" />
            </div>

            {/* STATUS FILTER */}
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
  <option value="in_progress">In progress</option>
</select>

{/* COURSE FILTER */}
<select
  className="border px-3 py-2 rounded ml-2"
  value={selectedCourseId}
  onChange={(e) => {
    setSelectedCourseId(e.target.value);
    setPage(1);
  }}
>
  <option value="all">All Courses</option>
  {enrolledData?.courses.map((c: CourseOption) => (
    <option key={c.id} value={c.id}>
      {c.title}
    </option>
  ))}
</select>

{/* DEPARTMENT FILTER */}
<select
  className="border px-3 py-2 rounded ml-2"
  value={selectedDepartmentId}
  onChange={(e) => {
    setSelectedDepartmentId(e.target.value);
    setPage(1);
  }}
>
  <option value="all">All Departments</option>
  {enrolledData?.departments.map((d: DepartmentOption) => (
    <option key={d.id} value={d.id}>
      {d.name}
    </option>
  ))}
</select>


            <div className="flex gap-2">
              <button
                onClick={downloadCSV}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                <Download size={16} /> CSV
              </button>
              {/* <button
                onClick={downloadPDF}
                className="bg-gray-800 text-white px-4 py-2 rounded"
              >
                <FileText size={16} /> PDF
              </button> */}
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
      <th>Hours Spent</th>
      <th>Completion %</th>
      <th>Last Activity</th>
      <th>Course</th>
      <th>Department</th>
    </tr>
  </thead>
  <tbody>
    {learners.map((l, i) => (
      <tr key={i} className="border-b">
        {/* Name */}
        <td className="py-2">{l.name}</td>

        {/* Email */}
        <td>{l.email}</td>

        {/* Status */}
        <td className="space-y-1">
          {l.courses && l.courses.length > 0 ? (
            <div className="space-y-1">
              {l.courses.map((c) => (
                <span
                  key={c.course_id}
                  className={`px-2 py-1 text-xs rounded font-semibold inline-block ${
                    c.status === "passed"
                      ? "bg-green-100 text-green-700"
                      : c.status === "in_progress"
                      ? "bg-yellow-100 text-yellow-700"
                      : c.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {c.status.replace("_", " ").toUpperCase()}
                </span>
              ))}
            </div>
          ) : (
            <span className="px-2 py-1 text-xs rounded font-semibold inline-block bg-gray-100 text-gray-600">
              {l.status.replace("_", " ").toUpperCase()}
            </span>
          )}
        </td>

        {/* Score */}
        <td>{l.score}%</td>

        {/* Attempts */}
        <td>{l.attempts ?? 0}</td>

        {/* Hours Spent */}
        <td>{(l.hours_spent ?? 0).toFixed(2)} hrs</td>

        {/* Completion % */}
        <td>{l.progress_percentage ?? 0}%</td>

        {/* Last Activity */}
        <td>{l.last_activity ?? "-"}</td>

        {/* Courses */}
        <td>
          {l.courses && l.courses.length > 0 ? (
            <ul className="space-y-1">
              {l.courses.map((c) => (
                <li key={c.course_id} className="text-xs font-medium">
                  {c.course_title}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </td>

        {/* Departments */}
        <td>
          {l.departments && l.departments.length > 0 ? (
            <ul className="space-y-1">
              {l.departments.map((d) => (
                <li key={d.id} className="text-xs font-medium">
                  {d.name}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </td>
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

      </>
    </div>
    </>
  );
}