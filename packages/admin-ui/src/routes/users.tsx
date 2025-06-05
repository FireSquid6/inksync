import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { Plus, Pencil, Shield, User, Key, Copy, Trash2 } from 'lucide-react';
import { Link } from "@tanstack/react-router";
import { SidebarLayout } from '@/components/layout';
import { PageHeader, SearchBar, DataTable, EmptyState, ResultsCount, formatDate } from '@/components/table';
import { getProtected } from '@/lib/state';
import { useJoincodes, useUsers } from '@/lib/hooks';

export const Route = createFileRoute('/users')({
  loader: () => {
    getProtected();
  },
  component: RouteComponent,
})


function RouteComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [joincodeSearchTerm, setJoincodeSearchTerm] = useState('');
  const { users } = useUsers();
  const { joincodes } = useJoincodes();

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJoincodes = joincodes.filter(joincode =>
    joincode.code.toLowerCase().includes(joincodeSearchTerm.toLowerCase()) ||
    joincode.creator.toLowerCase().includes(joincodeSearchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-yellow-500" />;
      default:
        return <User className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Superadmin':
        return 'badge-error';
      case 'Admin':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  const getJoincodeStatusBadgeClass = (joincode: any) => {
    if (joincode.status === 'expired' || new Date() > joincode.expiresAt) {
      return 'badge-error';
    }
    if (joincode.currentUses >= joincode.maxUses) {
      return 'badge-warning';
    }
    return 'badge-success';
  };

  const getJoincodeStatusText = (joincode: any) => {
    if (joincode.status === 'expired' || new Date() > joincode.expiresAt) {
      return 'expired';
    }
    if (joincode.currentUses >= joincode.maxUses) {
      return 'exhausted';
    }
    return 'active';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <SidebarLayout>
      <div className="p-6">
        <PageHeader
          title="Users"
          description="Manage user accounts and permissions"
        />

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search users..."
        />

        <DataTable headers={["User", "Role", "Actions"]}>
          {filteredUsers.length === 0 ? (
            <EmptyState
              message={searchTerm ? "No users match your search" : "No users found"}
              colSpan={7}
            />
          ) : (
            filteredUsers.map((user) => (
              <tr key={user.id} className="hover">
                <td>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-base-content/70">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <span className={`badge ${getRoleBadgeClass(user.role)} badge-sm`}>
                      {user.role}
                    </span>
                  </div>
                </td>
                <td>
                  <Link
                    to="/users/$user"
                    params={{
                      user: user.id
                    }}
                    className="btn btn-ghost btn-sm gap-1"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                </td>
              </tr>
            ))
          )}
        </DataTable>

        <ResultsCount
          searchTerm={searchTerm}
          filteredCount={filteredUsers.length}
          totalCount={users.length}
          itemName="users"
        />

        {/* Joincodes Section */}
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Join Codes</h2>
              <p className="text-base-content/70 mt-1">
                Manage invitation codes for new users
              </p>
            </div>
            <button className="btn btn-primary gap-2">
              <Key className="w-4 h-4" />
              Generate Code
            </button>
          </div>

          <SearchBar
            searchTerm={joincodeSearchTerm}
            onSearchChange={setJoincodeSearchTerm}
            placeholder="Search join codes..."
          />

          <DataTable headers={["Code", "Created By", "Expires", "Status", "Actions"]}>
            {filteredJoincodes.length === 0 ? (
              <EmptyState
                message={joincodeSearchTerm ? "No join codes match your search" : "No join codes found"}
                colSpan={6}
              />
            ) : (
              filteredJoincodes.map((joincode) => (
                <tr key={joincode.code} className="hover">
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-sm bg-base-200 px-2 py-1 rounded">
                        {joincode.code}
                      </div>
                      <button
                        onClick={() => copyToClipboard(joincode.code)}
                        className="btn btn-ghost btn-xs"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">{joincode.creator.username}</div>
                  </td>
                  <td>
                    <div className="text-sm">{formatDate(joincode.expiresAt)}</div>
                  </td>
                  <td>
                    <span className={`badge ${getJoincodeStatusBadgeClass(joincode)} badge-sm`}>
                      {getJoincodeStatusText(joincode)}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm gap-1">
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="btn btn-ghost btn-sm gap-1 text-error">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </DataTable>

          <ResultsCount
            searchTerm={joincodeSearchTerm}
            filteredCount={filteredJoincodes.length}
            totalCount={joincodes.length}
            itemName="join codes"
          />
        </div>
      </div>
    </SidebarLayout>
  );
}
