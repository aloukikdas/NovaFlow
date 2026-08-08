"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../lib/api";

export default function DashboardPage() {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading your workspaces...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500 bg-red-50 p-4 rounded-md">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Workspaces</h1>
        
        {workspaces.length === 0 ? (
          <p className="text-gray-600">You don't belong to any workspaces yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <div 
                key={ws.id} 
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <h2 className="text-xl font-bold text-gray-800 truncate">{ws.name}</h2>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {ws.description || "No description provided."}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-semibold tracking-wide">
                    {ws.members?.[0]?.role || 'MEMBER'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(ws.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}