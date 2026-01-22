'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
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
} from 'recharts';
import { Download, LogOut } from 'lucide-react';
import Papa from 'papaparse';

interface User {
  _id: string;
  email: string;
  createdAt: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function LMSDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState('90');

  const router = useRouter();

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `/api/fetch-user`,
          { withCredentials: true }
        );
        setUser(res.data.user);
      } catch {
        router.push('/login');
      } finally {
        setIsFetching(false);
      }
    };

    fetchUser();
  }, [router]);

  // Fetch dashboard data
  useEffect(() => {
    if (!user) return;

    fetch(`https://your-site.com?filter=${filter}`)
      .then(res => res.json())
      .then(json => setData(json));
  }, [filter, user]);

  // Logout
  const handleLogout = async () => {
    try {
      await axios.post(
        `/api/log-out`,
        {},
        { withCredentials: true }
      );
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  const downloadCSV = () => {
    const csv = Papa.unparse(data.learners);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learners.csv';
    a.click();
  };

  if (isFetching || !data) {
    return <p className="text-center mt-16">Loading Dashboard...</p>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">LMS Performance Insights</h1>
          <p className="text-sm text-gray-500">Welcome, {user?.email}</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            onChange={(e) => setFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="90">Last 3 Months</option>
            <option value="7">Last Week</option>
            <option value="1">Last 24 Hours</option>
          </select>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 shadow rounded">
          <p className="text-gray-500">Avg Score</p>
          <p className="text-2xl font-bold">{data.metrics.avgScore}%</p>
        </div>

        <div className="bg-white p-4 shadow rounded">
          <p className="text-gray-500">Pass Mark</p>
          <p className="text-2xl font-bold">{data.metrics.passMark}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded shadow h-80">
          <h2 className="mb-4 font-semibold">Learner Status Distribution</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.charts}
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
              >
                {data.charts.map((_: any, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded shadow h-80">
          <h2 className="mb-4 font-semibold">Activity Bar Chart</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.charts}>
              <XAxis dataKey="name" />
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
          <h2 className="font-semibold">Student Details</h2>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">User ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.learners.map((l: any) => (
              <tr key={l.user_id} className="border-b">
                <td className="py-2">{l.user_id}</td>
                <td>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
