import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { Plus, Pencil, Shield, User, Key, Copy, Trash2 } from 'lucide-react';
import { Link } from "@tanstack/react-router";
import { SidebarLayout } from '@/components/layout';
import { PageHeader, SearchBar, DataTable, EmptyState, ResultsCount, formatDate } from '@/components/table';
import { getProtected } from '@/lib/state';

export const Route = createFileRoute('/users')({
  loader: () => {
    getProtected();
  },
  component: RouteComponent,
})

// Dummy user data
const dummyUsers = [
  {
    id: "user_1",
    username: "alice_smith",
    email: "alice@example.com",
    role: "admin",
    status: "active",
    createdAt: new Date("2024-01-15"),
    lastLogin: new Date("2024-06-03"),
  },
  {
    id: "user_2", 
    username: "bob_jones",
    email: "bob@example.com",
    role: "user",
    status: "active",
    createdAt: new Date("2024-02-20"),
    lastLogin: new Date("2024-06-01"),
  },
  {
    id: "user_3",
    username: "charlie_brown",
    email: "charlie@example.com", 
    role: "user",
    status: "inactive",
    createdAt: new Date("2024-03-10"),
    lastLogin: new Date("2024-05-15"),
  },
  {
    id: "user_4",
    username: "diana_wilson",
    email: "diana@example.com",
    role: "moderator", 
    status: "active",
    createdAt: new Date("2024-04-05"),
    lastLogin: new Date("2024-06-02"),
  },
];

// Dummy joincode data
const dummyJoincodes = [
  {
    id: "jc_1",
    code: "JOIN-ALPHA-2024",
    createdBy: "alice_smith",
    createdAt: new Date("2024-06-01"),
    expiresAt: new Date("2024-07-01"),
    maxUses: 10,
    currentUses: 3,
    status: "active"
  },
  {
    id: "jc_2", 
    code: "JOIN-BETA-2024",
    createdBy: "diana_wilson",
    createdAt: new Date("2024-05-20"),
    expiresAt: new Date("2024-06-20"),
    maxUses: 5,
    currentUses: 5,
    status: "expired"
  },
  {
    id: "jc_3",
    code: "JOIN-TEMP-2024",
    createdBy: "alice_smith", 
    createdAt: new Date("2024-06-03"),
    expiresAt: new Date("2024-12-31"),
    maxUses: 1,
    currentUses: 0,
    status: "active"
  },
  {
    id: "jc_4",
    code: "JOIN-TEAM-2024",
    createdBy: "diana_wilson",
    createdAt: new Date("2024-05-15"),
    expiresAt: new Date("2024-08-15"),
    maxUses: 20,
    currentUses: 12,
    status: "active"
  },
];

function RouteComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [joincodeSearchTerm, setJoincodeSearchTerm] = useState('');

  const filteredUsers = dummyUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJoincodes = dummyJoincodes.filter(joincode =>
    joincode.code.toLowerCase().includes(joincodeSearchTerm.toLowerCase()) ||
    joincode.createdBy.toLowerCase().includes(joincodeSearchTerm.toLowerCase())
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
      case 'admin':
        return 'badge-error';
      case 'moderator':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return status === 'active' ? 'badge-success' : 'badge-ghost';
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
          action={
            <button className="btn btn-primary gap-2">
              <Plus className="w-4 h-4" />
              New User
            </button>
          }
        />

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search users..."
        />

        <DataTable headers={["User", "Email", "Role", "Status", "Created", "Last Login", "Actions"]}>
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
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-10">
                        <span className="text-sm">{user.username.slice(0, 2).toUpperCase()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-base-content/70">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="text-sm">{user.email}</div>
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
                  <span className={`badge ${getStatusBadgeClass(user.status)} badge-sm`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="text-sm">{formatDate(user.createdAt)}</div>
                </td>
                <td>
                  <div className="text-sm">{formatDate(user.lastLogin)}</div>
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
          totalCount={dummyUsers.length}
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

          <DataTable headers={["Code", "Created By", "Usage", "Expires", "Status", "Actions"]}>
            {filteredJoincodes.length === 0 ? (
              <EmptyState
                message={joincodeSearchTerm ? "No join codes match your search" : "No join codes found"}
                colSpan={6}
              />
            ) : (
              filteredJoincodes.map((joincode) => (
                <tr key={joincode.id} className="hover">
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
                    <div className="text-sm">{joincode.createdBy}</div>
                    <div className="text-xs text-base-content/70">
                      {formatDate(joincode.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <span className="font-medium">{joincode.currentUses}</span>
                      <span className="text-base-content/70"> / {joincode.maxUses}</span>
                    </div>
                    <div className="w-full bg-base-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{
                          width: `${Math.min((joincode.currentUses / joincode.maxUses) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
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
            totalCount={dummyJoincodes.length}
            itemName="join codes"
          />
        </div>
      </div>
    </SidebarLayout>
  );
}
