"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../../lib/api";
import toast from "react-hot-toast";

export default function WorkspaceMembersPage({ 
  params 
}: { 
  params: Promise<{ workspaceId: string }> 
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.workspaceId;

  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await apiClient(`/workspaces/${workspaceId}/members`);
        setMembers(response.data);
      } catch (err: any) {
        toast.error("Failed to load members");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, [workspaceId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      await apiClient(`/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setIsInviteModalOpen(false);
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading members...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/workspaces/${workspaceId}`)} className="text-gray-400 hover:text-gray-600">
            &larr; Back to Workspace
          </button>
          <div className="h-4 w-px bg-gray-300"></div>
          <h1 className="text-lg font-bold text-gray-900">Team Members</h1>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          + Invite Member
        </button>
      </nav>

      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{member.user.name}</div>
                    <div className="text-sm text-gray-500">{member.user.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-semibold">
                      {member.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Invite to Workspace</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="colleague@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="MEMBER">Member (Can edit tasks)</option>
                  <option value="VIEWER">Viewer (Read-only)</option>
                  <option value="ADMIN">Admin (Can invite others)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" disabled={isInviting} className="px-4 py-2 bg-indigo-600 text-white rounded-md">
                  {isInviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}