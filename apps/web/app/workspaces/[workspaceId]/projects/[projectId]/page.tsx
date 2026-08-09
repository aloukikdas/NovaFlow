"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../../../lib/api";

export default function ProjectTaskBoard({ 
  params 
}: { 
  params: Promise<{ workspaceId: string, projectId: string }> 
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { workspaceId, projectId } = resolvedParams;

  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await apiClient(`/workspaces/${workspaceId}/projects/${projectId}/tasks`);
        setTasks(response.data);
      } catch (err: any) {
        setError(err.message);
        if (err.message === "Unauthorized" || err.message === "Authentication token is missing") {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [workspaceId, projectId, router]);

  const columns = [
    { id: 'BACKLOG', title: 'Backlog' },
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'DONE', title: 'Done' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse">Loading task board...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/workspaces/${workspaceId}`)} className="text-gray-400 hover:text-gray-600 transition-colors">
            &larr; Back to Workspace
          </button>
          <div className="h-4 w-px bg-gray-300"></div>
          <h1 className="text-lg font-bold text-gray-900">Project Board</h1>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          + New Task
        </button>
      </nav>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 text-center shrink-0 border-b border-red-100">
          {error}
        </div>
      )}

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <div className="flex gap-6 min-w-max h-full">
          
          {columns.map(col => (
            <div key={col.id} className="w-80 bg-gray-100/80 rounded-xl p-4 flex flex-col max-h-full border border-gray-200/50">
              
              {/* Column Header */}
              <h3 className="font-bold text-gray-700 flex justify-between items-center mb-4 shrink-0">
                {col.title}
                <span className="bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </h3>
              
              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
                {tasks.filter(t => t.status === col.id).map(task => (
                  
                  <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-grab group">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                        task.priority === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-100' :
                        task.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {task.title}
                    </h4>
                    
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>
                  
                ))}
                
                {tasks.filter(t => t.status === col.id).length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg h-24 flex items-center justify-center">
                    <p className="text-xs text-gray-400 font-medium">Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
}