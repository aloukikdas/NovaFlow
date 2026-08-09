"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await apiClient("/workspaces");
        setWorkspaces(response.data);
      } catch (err: any) {
        setError(err.message);
        // If the user isn't authorized, kick them back to login
        if (err.message === "Unauthorized" || err.message === "Authentication token is missing") {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
      router.push("/login"); // Send back to login page on success
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading your workspaces...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black text-indigo-600 tracking-tight">NovaFlow</h1>
        <button 
          onClick={handleLogout}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sign out
        </button>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-8">My Workspaces</h2>
          
          {workspaces.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
              <p className="text-gray-500">You don't belong to any workspaces yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((ws) => (
                <div 
                  key={ws.id}
                  onClick={() => router.push(`/workspaces/${ws.id}`)} 
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group"
                >
                  <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {ws.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {ws.description || "No description provided."}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-semibold tracking-wide">
                      {ws.members?.[0]?.role || 'MEMBER'}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(ws.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}