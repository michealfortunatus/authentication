'use client';

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/log-in`, {
        email,
        password,
      });

      toast.success(response.data.message);
      router.push("/"); // redirect to dashboard/home
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[100vh] py-10 px-4">
      <div className="bg-white shadow-lg p-10 rounded-xl w-full max-w-md">
        <h2 className="text-center font-semibold text-lg">Log in to AppX</h2>
        <p className="text-center text-gray-600 mt-1 text-sm">Welcome back! Please log in.</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div className="flex flex-col">
            <label className="font-medium mb-1">Email</label>
            <input
              type="email"
              className="border px-3 py-2 rounded-lg"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="font-medium mb-1">Password</label>
            <input
              type="password"
              className="border px-3 py-2 rounded-lg"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full bg-[#0077b6] text-white py-2 rounded-lg hover:bg-[#023e8a] transition-colors ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-center text-sm mt-5">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-[#0077b6]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
