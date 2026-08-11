"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api";
import toast from "react-hot-toast";
import UserMenu from "../../components/UserMenu";

export default function WorkspacePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.workspaceId;

  const [workspace, setWorkspace] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProject(true);
    try {
      const response = await apiClient(`/workspaces/${workspaceId}/projects`, {
        method: "POST",
        body: JSON.stringify({ name: newProjectName, description: newProjectDescription }),
      });
      setProjects([...projects, response.data]);
      setIsNewProjectModalOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      toast.success("Project created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    } finally {
      setIsCreatingProject(false);
    }
  };

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
        <button 
          onClick={() => router.push(`/workspaces/${workspaceId}/members`)}
          className="text-sm font-medium text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-colors border border-gray-200"
        >
          Team Members &rarr;
        </button>
        <UserMenu />
      </nav>

      {/* Main Content */}
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Projects</h2>
            <p className="text-gray-500 mt-1 text-sm">Select a project to view its tasks.</p>
          </div>
          <button 
            onClick={() => setIsNewProjectModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
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
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="E.g., Mobile App Launch"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsNewProjectModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isCreatingProject} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {isCreatingProject ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}