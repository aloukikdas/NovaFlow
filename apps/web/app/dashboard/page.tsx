"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../lib/api";
import toast from "react-hot-toast";
import UserMenu from "../components/UserMenu"

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [wsRes, invRes] = await Promise.all([
        apiClient("/workspaces"),
        apiClient("/workspaces/invitations/pending")
      ]);
      setWorkspaces(wsRes.data);
      setInvitations(invRes.data);
    } catch (err: any) {
      setError(err.message);
      if (err.message === "Unauthorized" || err.message === "Authentication token is missing") {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const handleAcceptInvite = async (token: string) => {
    try {
      await apiClient(`/workspaces/invitations/${token}/accept`, { method: "POST" });
      toast.success("Welcome to the workspace!");
      fetchData(); // Reload the dashboard to show the new workspace
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation");
    }
  };

  const handleCreateWorkspace = async () => {
    const name = window.prompt("Enter a name for your new workspace:");
    if (!name) return;
    
    try {
      await apiClient("/workspaces", {
        method: "POST",
        body: JSON.stringify({ 
          name, 
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4),
          description: "My new workspace"
        })
      });
      toast.success("Workspace created!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create workspace");
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
        <UserMenu /> {/* <-- Replaced the old text logout button! */}
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">My Workspaces</h2>
            <button 
              onClick={handleCreateWorkspace}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              + New Workspace
            </button>
          </div>

          {/* PENDING INVITATIONS SECTION */}
          {invitations.length > 0 && (
            <div className="mb-10 bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h2 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                Pending Invitations
              </h2>
              <div className="space-y-3">
                {invitations.map(inv => (
                  <div key={inv.id} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-indigo-100/50">
                    <div>
                      <p className="font-bold text-gray-900">{inv.workspace.name}</p>
                      <p className="text-sm text-gray-500">You have been invited to join as a <span className="font-semibold text-indigo-600">{inv.role}</span></p>
                    </div>
                    <button 
                      onClick={() => handleAcceptInvite(inv.token)} 
                      className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Accept & Join
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* WORKSPACES GRID */}
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