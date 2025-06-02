import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { Folder, Cloud, Plus, Search, Pencil } from 'lucide-react';
import type { VaultDisplay } from '@/lib/treaty';
import { Link } from "@tanstack/react-router";
import { SidebarLayout } from '@/components/layout';

export const Route = createFileRoute('/vaults')({
  component: RouteComponent,
})

const vaults: VaultDisplay[] = [
  {
    name: 'Project Alpha Documents',
    type: 'directory',
    location: '/var/storage/project-alpha',
    created: new Date('2024-01-15'),
    size: 2469606195 // ~2.3 GB
  },
  {
    name: 'Marketing Assets',
    type: 's3',
    location: 's3://company-marketing-bucket/assets',
    created: new Date('2024-02-03'),
    size: 897581056 // ~856 MB
  },
  {
    name: 'Customer Data Archive',
    type: 's3',
    location: 's3://customer-archive/data',
    created: new Date('2024-01-08'),
    size: 13316337664 // ~12.4 GB
  },
  {
    name: 'Development Resources',
    type: 'directory',
    location: '/opt/dev-resources',
    created: new Date('2024-03-12'),
    size: 5050331136 // ~4.7 GB
  },
  {
    name: 'Legal Documents',
    type: 'directory',
    location: '/secure/legal-docs',
    created: new Date('2024-01-20'),
    size: 152043520 // ~145 MB
  },
  {
    name: 'Backup Storage',
    type: 's3',
    location: 's3://company-backups/primary',
    created: new Date('2024-02-28'),
    size: 31043616768 // ~28.9 GB
  }
];

function RouteComponent() {
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper function to format date
  const formatDate = (date: Date) => {
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

  const handleDetailsClick = (vault: VaultDisplay) => {
    console.log('Show details for vault:', vault);
    // In real app, this would navigate to vault details page
  };

  const getTypeIcon = (type: string) => {
    return type === 'directory' ? <Folder className="w-4 h-4" /> : <Cloud className="w-4 h-4" />;
  };

  const getTypeBadge = (type: string) => {
    const badgeClass = type === 'directory' ? 'badge-primary' : 'badge-secondary';
    return (
      <span className={`badge ${badgeClass} gap-1`}>
        {getTypeIcon(type)}
        {type === 'directory' ? 'Directory' : 'S3'}
      </span>
    );
  };

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
            <div className="input-group">
              <span className="bg-base-200">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search vaults..."
                className="input input-bordered flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Total Vaults</div>
            <div className="stat-value text-primary">{vaults.length}</div>
          </div>
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Directory Vaults</div>
            <div className="stat-value text-secondary">
              {vaults.filter(v => v.type === 'directory').length}
            </div>
          </div>
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">S3 Vaults</div>
            <div className="stat-value text-accent">
              {vaults.filter(v => v.type === 's3').length}
            </div>
          </div>
        </div>

        {/* Vaults Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
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
                          {getTypeBadge(vault.type)}
                        </td>
                        <td>
                          <div className="font-mono text-sm bg-base-200 px-2 py-1 rounded max-w-xs truncate" title={vault.location}>
                            {vault.location}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">{formatDate(vault.created)}</div>
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
