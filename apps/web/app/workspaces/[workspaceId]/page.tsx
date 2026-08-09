"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api";

export default function WorkspacePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.workspaceId;

  const [workspace, setWorkspace] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wsResponse, projectsResponse] = await Promise.all([
          apiClient(`/workspaces/${workspaceId}`),
          apiClient(`/workspaces/${workspaceId}/projects`)
        ]);

        setWorkspace(wsResponse.data);
        setProjects(projectsResponse.data);
      } catch (err: any) {
        setError(err.message);
        if (err.message === "Unauthorized" || err.message === "Authentication token is missing") {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workspaceId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Workspace not found"}</p>
          <button onClick={() => router.push("/dashboard")} className="text-indigo-600 hover:underline">
            &larr; Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-gray-600 transition-colors">
            &larr; Dashboard
          </button>
          <div className="h-4 w-px bg-gray-300"></div>
          <h1 className="text-lg font-bold text-gray-900">{workspace.name}</h1>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Projects</h2>
            <p className="text-gray-500 mt-1 text-sm">Select a project to view its tasks.</p>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
            <p className="text-gray-500 mb-4">No projects found in this workspace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id}
                onClick={() => router.push(`/workspaces/${workspaceId}/projects/${project.id}`)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {project.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3 mb-6">
                  {project.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200">
                      {project.owner?.name?.charAt(0) || '?'}
                    </div>
                    <span>{project.owner?.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}