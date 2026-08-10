"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../../../lib/api";
import { io } from "socket.io-client";

export default function ProjectTaskBoard({ 
  params 
}: { 
  params: Promise<{ workspaceId: string, projectId: string }> 
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { workspaceId, projectId } = resolvedParams;

  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [viewMode, setViewMode] = useState<"BOARD" | "LIST">("BOARD");
  const [filterAssignee, setFilterAssignee] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const queryParams = filterAssignee ? `?assigneeId=${filterAssignee}` : "";
        const [tasksRes, membersRes] = await Promise.all([
          apiClient(`/workspaces/${workspaceId}/projects/${projectId}/tasks${queryParams}`),
          apiClient(`/workspaces/${workspaceId}/members`)
        ]);
        setTasks(tasksRes.data);
        setMembers(membersRes.data);
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
  }, [workspaceId, projectId, router, filterAssignee]);

  useEffect(() => {
    if (!projectId) return;
    
    const socket = io("http://localhost:4000", {
      withCredentials: true,
    });
    socket.on("connect", () => {
      console.log("Connected to WebSocket");
      socket.emit("project:join", projectId);
    });
    socket.on("task:updated", (updatedTask: any) => {
      console.log("Real-time update received!", updatedTask);
      setTasks((currentTasks) => 
        currentTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    });
    return () => {
      socket.disconnect();
    };
  }, [projectId]);

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
          status: "TODO",
          assigneeId: newTaskAssignee || undefined
        })
      });
      setTasks([...tasks, response.data]);
      setIsNewTaskModalOpen(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("MEDIUM");
      setNewTaskAssignee("");
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

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const handleOpenTask = async (task: any) => {
    setSelectedTask(task);
    setComments([]);
    try {
      const response = await apiClient(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    
    setIsPostingComment(true);
    try {
      const response = await apiClient(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${selectedTask.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment }),
      });
      setComments([...comments, response.data]);
      setNewComment("");
    } catch (err: any) {
      alert(`Failed to post comment: ${err.message}`);
    } finally {
      setIsPostingComment(false);
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

      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500">Filter:</span>
          <select 
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500"
          >
            <option value="">All Assignees</option>
            {members.map(m => (
              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode("BOARD")}
            className={`px-3 py-1 text-xs font-bold rounded-md ${viewMode === "BOARD" ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}
          >
            Kanban Board
          </button>
          <button 
            onClick={() => setViewMode("LIST")}
            className={`px-3 py-1 text-xs font-bold rounded-md ${viewMode === "LIST" ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}
          >
            List View
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 text-center shrink-0 border-b border-red-100">
          {error}
        </div>
      )}

      {/* Main Content Area (Ternary Operator) */}
      {viewMode === "LIST" ? (
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4">Task Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map(task => (
                  <tr key={task.id} onClick={() => handleOpenTask(task)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="p-4 font-medium text-gray-900">{task.title}</td>
                    <td className="p-4"><span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-md">{task.status.replace('_', ' ')}</span></td>
                    <td className="p-4"><span className="text-xs font-bold text-gray-500">{task.priority}</span></td>
                    <td className="p-4 text-sm text-gray-600">{task.assignee?.name || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
          <div className="flex gap-6 min-w-max h-full">
            {columns.map(col => (
              <div 
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)} 
                  className="w-80 bg-gray-100/80 rounded-xl p-4 flex flex-col max-h-full border border-gray-200/50"
              >
                
                <h3 className="font-bold text-gray-700 flex justify-between items-center mb-4 shrink-0">
                  {col.title}
                  <span className="bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {tasks.filter(t => t.status === col.id).length}
                  </span>
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
                  {tasks.filter(t => t.status === col.id).map(task => (
                    
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => handleOpenTask(task)}
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
                        {task.assignee && (
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-[10px]" title={task.assignee.name}>
                          {task.assignee.name.charAt(0)}
                        </div>
                      )}
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
      )}

      {/* Modals */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
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

      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col overflow-hidden border border-gray-100">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider bg-indigo-50 text-indigo-700">
                    {selectedTask.status.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider bg-gray-100 text-gray-700">
                    {selectedTask.priority}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-2">{selectedTask.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 bg-white">
              
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Description</h3>
                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap">
                  {selectedTask.description || <span className="text-gray-400 italic">No description provided.</span>}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Activity & Comments</h3>
                
                <div className="flex-1 space-y-4 mb-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No comments yet. Start the conversation!</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-sm">
                          {comment.author?.name?.charAt(0) || '?'}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 w-full">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-gray-900">{comment.author?.name}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <form onSubmit={handlePostComment} className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ask a question or post an update..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isPostingComment}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}