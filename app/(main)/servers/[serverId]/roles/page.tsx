'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Role, ServerMember } from '@/lib/types';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ServerSidebar from '@/components/servers/ServerSidebar';
import ChannelSidebar from '@/components/channels/ChannelSidebar';
import UserPanel from '@/components/users/UserPanel';

export default function RolesPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const [serverId, setServerId] = useState<string>('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<(ServerMember & { user?: any; role?: Role })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#99aab5');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    params.then((p) => {
      setServerId(p.serverId);
      loadRoles(p.serverId);
      loadMembers(p.serverId);
    });
  }, [params]);

  const loadRoles = async (id: string) => {
    try {
      const { data: rolesData } = await supabase
        .from('roles')
        .select('*')
        .eq('server_id', id)
        .order('position');

      setRoles(rolesData || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (id: string) => {
    try {
      const { data: membersData } = await supabase
        .from('server_members')
        .select(`
          *,
          user:users(id, username, avatar_url),
          role:roles(id, name, color)
        `)
        .eq('server_id', id);

      setMembers(membersData || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleCreateRole = async () => {
    if (!roleName.trim() || !serverId) return;

    try {
      const maxPosition = roles.length > 0 ? Math.max(...roles.map(r => r.position)) + 1 : 0;

      const { data: newRole, error } = await supabase
        .from('roles')
        .insert({
          server_id: serverId,
          name: roleName.trim(),
          color: roleColor,
          permissions: {},
          position: maxPosition,
        })
        .select()
        .single();

      if (error) throw error;

      setRoles([...roles, newRole]);
      setShowCreateRole(false);
      setRoleName('');
      setRoleColor('#99aab5');
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleAssignRole = async (memberId: string, roleId: string | null) => {
    try {
      const { error } = await supabase
        .from('server_members')
        .update({ role_id: roleId })
        .eq('id', memberId);

      if (error) throw error;

      loadMembers(serverId);
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const { error } = await supabase.from('roles').delete().eq('id', roleId);

      if (error) throw error;

      setRoles(roles.filter(r => r.id !== roleId));
      loadMembers(serverId);
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <ServerSidebar />
      <ChannelSidebar />
      <div className="flex-1 flex flex-col bg-gray-900">
        <div className="h-12 border-b border-gray-700 px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <Link
              href={`/app/servers/${serverId}`}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-semibold text-white">Roles & Members</h1>
          </div>
          <button
            onClick={() => setShowCreateRole(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {showCreateRole && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-white">Create Role</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role Name</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="New Role"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <input
                  type="color"
                  value={roleColor}
                  onChange={(e) => setRoleColor(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-600"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateRole}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateRole(false);
                    setRoleName('');
                    setRoleColor('#99aab5');
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Roles</h2>
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <span className="font-medium text-white">{role.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Members</h2>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={member.user?.avatar_url || `https://ui-avatars.com/api/?name=${member.user?.username}`}
                      alt={member.user?.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-white">{member.user?.username}</div>
                      {member.role && (
                        <div className="text-sm text-gray-400">{member.role.name}</div>
                      )}
                    </div>
                  </div>
                  <select
                    value={member.role_id || ''}
                    onChange={(e) => handleAssignRole(member.id, e.target.value || null)}
                    className="bg-gray-700 text-white rounded px-3 py-1 border border-gray-600"
                  >
                    <option value="">No Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <UserPanel />
    </div>
  );
}
