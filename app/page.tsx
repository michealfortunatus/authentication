"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Home() {
  const [user, setUser] = useState<any>(null); // Default to null
  const [isFetchingUser, setIsFetchingUser] = useState(true); // Start fetching as true
  const router = useRouter();

  useEffect(() => {
    axios
      .get("https://authentication-ten-gules.vercel.app/api/fetch-user")
      .then((response) => setUser(response.data.user))
      .catch((error) => console.error("Error fetching user:", error))
      .finally(() => setIsFetchingUser(false)); // Done fetching
  }, []);

  useEffect(() => {
    if (!isFetchingUser && user === null) {
      router.push("/login"); // Redirect to login if no user
    }
  }, [isFetchingUser, user, router]);

  if (isFetchingUser) {
    return <p>Loading...</p>; // Show loading while fetching user
  }

  const handleLogout = async () => {
    try {
      const response = await axios.post("https://authentication-ten-gules.vercel.app/api/log-out");
      toast.success(response.data.message);
      router.push("/login");
    } catch (error) {
      toast.error("Failed to log out.");
      console.error("Logout error:", error);
    }
  };

  return user ? (
    <div className="max-w-2xl mx-4 sm:max-w-sm md:max-w-sm lg:max-w-sm xl:max-w-sm sm:mx-auto md:mx-auto lg:mx-auto xl:mx-auto mt-16 bg-white shadow-xl rounded-lg text-gray-900">
      <div className="rounded-t-lg h-32 overflow-hidden">
        <img
          className="object-cover object-top w-full"
          src="https://images.pexels.com/photos/23475/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          alt="Mountain"
        />
      </div>
      <div className="text-center mt-5">
        <h2 className="font-semibold">{user?.username}</h2>
        <p className="text-gray-500">
          Welcome:{" "}
          {new Date(user?.createdAt).toLocaleDateString("en-US", {
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
  ) : null;
}
