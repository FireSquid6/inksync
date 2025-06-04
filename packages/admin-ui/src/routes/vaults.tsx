import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { Plus, Search, Pencil } from 'lucide-react';
import { Link } from "@tanstack/react-router";
import { SidebarLayout } from '@/components/layout';
import { useVaults } from '@/lib/hooks';
import { getProtected } from '@/lib/state';

export const Route = createFileRoute('/vaults')({
  loader: () => {
    getProtected();
  },
  component: RouteComponent,
})

function RouteComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const { vaults } = useVaults();

  // Helper function to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number | Date) => {
    const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  const filteredVaults = vaults.filter(vault =>
    vault.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vault.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Vaults</h1>
            <p className="text-base-content/70 mt-1">
              Manage your file synchronization vaults
            </p>
          </div>
          <button className="btn btn-primary gap-2">
            <Plus className="w-4 h-4" />
            New Vault
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="form-control flex-1">
            <label className="input">
              <span className="bg-base-200">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search vaults..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Created</th>
                    <th>Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVaults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <div className="text-base-content/50">
                          {searchTerm ? 'No vaults match your search' : 'No vaults found'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredVaults.map((vault) => (
                      <tr key={vault.name} className="hover">
                        <td>
                          <div className="font-medium">{vault.name}</div>
                        </td>
                        <td>
                          <div className="font-mono text-sm bg-base-200 px-2 py-1 rounded max-w-xs truncate" title={vault.location}>
                            {vault.location}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">{formatDate(vault.createdAt)}</div>
                        </td>
                        <td>
                          <div className="text-sm font-medium">{formatBytes(vault.size)}</div>
                        </td>
                        <td>
                          <Link
                            to="/vaults/$vault"
                            params={{
                              vault: vault.name
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
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Results count */}
        {searchTerm && (
          <div className="text-sm text-base-content/70 mt-4">
            Showing {filteredVaults.length} of {vaults.length} vaults
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
