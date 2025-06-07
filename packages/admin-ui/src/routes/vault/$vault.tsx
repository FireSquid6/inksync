import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { ArrowLeft, Trash2, UserPlus, FolderOpen, Users, HardDrive } from 'lucide-react';
import { Link } from "@tanstack/react-router";
import { SidebarLayout } from '@/components/layout';
import { DirectoryList } from '@/components/directory-list';
import { DataTable, EmptyState, PageHeader, formatBytes, formatDate } from '@/components/table';

export const Route = createFileRoute('/vault/$vault')({
  component: RouteComponent,
})

function RouteComponent() {
  const { vault: vaultName } = Route.useParams();
  
  // Dummy vault data
  const vaultData = {
    name: vaultName,
    directory: "/home/user/documents/projects",
    size: 157286400, // ~150MB
    createdAt: new Date('2024-01-15'),
    filesCount: 342,
    lastSync: new Date('2024-06-06T10:30:00')
  };

  // Dummy directory data
  const [currentRoot, setCurrentRoot] = useState(vaultData.directory);
  const [directories] = useState([
    "src",
    "docs", 
    "tests",
    "config",
    "assets"
  ]);

  // Dummy user permissions data
  const [userPermissions, setUserPermissions] = useState([
    { id: 1, username: "alice.dev", email: "alice@example.com", read: true, write: true },
    { id: 2, username: "bob.smith", email: "bob@example.com", read: true, write: false },
    { id: 3, username: "charlie.jones", email: "charlie@example.com", read: true, write: true },
  ]);

  const handleDirectoryClick = (directory: string) => {
    setCurrentRoot(`${currentRoot}/${directory}`);
  };

  const togglePermission = (userId: number, permission: 'read' | 'write') => {
    setUserPermissions(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, [permission]: !user[permission] }
          : user
      )
    );
  };

  const removeUser = (userId: number) => {
    setUserPermissions(prev => prev.filter(user => user.id !== userId));
  };

  const handleDeleteVault = () => {
    if (confirm(`Are you sure you want to delete vault "${vaultName}"? This action cannot be undone.`)) {
      // TODO: Implement vault deletion
      console.log('Deleting vault:', vaultName);
    }
  };

  return (
    <SidebarLayout>
      <div className="p-6">
        <PageHeader
          title={vaultData.name}
          description={`Manage vault details, permissions, and browse files. This is just an example.`}
          action={
            <div className="flex gap-2">
              <Link to="/vaults" className="btn btn-ghost gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Vaults
              </Link>
              <button 
                onClick={handleDeleteVault}
                className="btn btn-error gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Vault
              </button>
            </div>
          }
        />

        {/* Vault Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <HardDrive className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{formatBytes(vaultData.size)}</div>
                  <div className="text-sm text-base-content/70">Total Size</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-secondary" />
                <div>
                  <div className="text-2xl font-bold">{vaultData.filesCount}</div>
                  <div className="text-sm text-base-content/70">Files</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-accent" />
                <div>
                  <div className="text-2xl font-bold">{userPermissions.length}</div>
                  <div className="text-sm text-base-content/70">Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vault Details */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title">Vault Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-base-content/70">Directory</label>
                <div className="font-mono text-sm bg-base-200 px-3 py-2 rounded mt-1">
                  {vaultData.directory}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-base-content/70">Created</label>
                <div className="text-sm px-3 py-2 mt-1">
                  {formatDate(vaultData.createdAt)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-base-content/70">Last Sync</label>
                <div className="text-sm px-3 py-2 mt-1">
                  {formatDate(vaultData.lastSync)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Directory Browser */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title mb-4">Directory Browser</h2>
            <DirectoryList
              directories={directories}
              root={currentRoot}
              onDirectoryClick={handleDirectoryClick}
            />
          </div>
        </div>

        {/* User Permissions */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">User Permissions</h2>
              <button className="btn btn-primary btn-sm gap-2">
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>
            
            <DataTable headers={["User", "Email", "Read", "Write", "Actions"]}>
              {userPermissions.length === 0 ? (
                <EmptyState message="No users with access" colSpan={5} />
              ) : (
                userPermissions.map((user) => (
                  <tr key={user.id} className="hover">
                    <td>
                      <div className="font-medium">{user.username}</div>
                    </td>
                    <td>
                      <div className="text-sm text-base-content/70">{user.email}</div>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={user.read}
                        onChange={() => togglePermission(user.id, 'read')}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={user.write}
                        onChange={() => togglePermission(user.id, 'write')}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => removeUser(user.id)}
                        className="btn btn-ghost btn-sm text-error gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </DataTable>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
