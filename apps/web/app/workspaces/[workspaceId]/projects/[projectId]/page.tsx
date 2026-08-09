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
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiClient(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          priority: newTaskPriority,
          status: "TODO"
        })
      });
      setTasks([...tasks, response.data]);
      setIsNewTaskModalOpen(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("MEDIUM");
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move"; 
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    const taskToUpdate = tasks.find(t => t.id === draggedTaskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => 
      t.id === draggedTaskId ? { ...t, status: newStatus } : t
    ));
    setDraggedTaskId(null);
    try {
      await apiClient(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${draggedTaskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err: any) {
      setTasks(previousTasks);
      alert(`Failed to move task: ${err.message}`);
    }
  };

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
        <button
            onClick={() => setIsNewTaskModalOpen(true)} 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
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
            <div 
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)} 
                className="w-80 bg-gray-100/80 rounded-xl p-4 flex flex-col max-h-full border border-gray-200/50"
            >
              
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
                  
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-grab group ${draggedTaskId === task.id ? 'opacity-50 border-dashed' : ''}`}
                  >
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
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Create New Task</h2>
              <button 
                onClick={() => setIsNewTaskModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="E.g., Implement dark mode"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Add more details here..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}