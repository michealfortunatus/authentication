'use client';

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface User {
  _id: string;
  email: string;
  createdAt: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/fetch-user`, {
          withCredentials: true, // ensure cookies are sent
        });
        setUser(response.data.user);
      } catch (error: any) {
        console.error("Error fetching user:", error);
        router.push("/login");
      } finally {
        setIsFetching(false);
      }
    };

    fetchUser();
  }, [router]);

  // Logout function
  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/log-out`, {}, { withCredentials: true });
      toast.success("Logged out successfully.");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out.");
    }
  };

  if (isFetching) {
    return <p className="text-center mt-16">Loading...</p>;
  }

  if (!user) return null; // Redirect handled in useEffect

  return (
    <div className="max-w-2xl mx-auto mt-16 bg-white shadow-xl rounded-lg text-gray-900">


      <div className="text-center mt-5">
        <h2 className="font-semibold"> Welcome  {user.email}</h2>
        <p className="text-gray-500">
          Member since{" "}
          {new Date(user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="p-4 border-t mx-8 mt-2">
        <button
          onClick={handleLogout}
          className="w-1/2 block mx-auto rounded-full bg-[#0077b6] hover:shadow-lg text-white px-6 py-2 text-sm"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
