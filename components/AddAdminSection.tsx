"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AddAdminSection() {
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return toast.error("Enter a valid email.");
    setAddingAdmin(true);
    try {
      await axios.post("/api/add-admin", { email: newAdminEmail });
      toast.success("Admin added successfully.");
      setNewAdminEmail("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add admin.");
    } finally {
      setAddingAdmin(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow max-w-md my-4">
      <h2 className="font-semibold mb-2">Add Admin</h2>

      <div className="flex gap-2">
        <input
          type="email"
          value={newAdminEmail}
          onChange={(e) => setNewAdminEmail(e.target.value)}
          placeholder="admin@email.com"
          className="border px-3 py-2 rounded flex-1"
        />

        <button
          onClick={handleAddAdmin}
          disabled={addingAdmin}
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {addingAdmin ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}
