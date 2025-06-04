import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { Plus, Pencil, Shield, User } from 'lucide-react';
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

function RouteComponent() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = dummyUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
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
      </div>
    </SidebarLayout>
  );
}
