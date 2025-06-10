import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Trash2, HardDrive } from 'lucide-react';
import { Link } from "@tanstack/react-router";
import { SidebarLayout } from '@/components/layout';
import { VaultBrowser } from '@/components/directory-list';
import { PageHeader, formatBytes, formatDate } from '@/components/table';
import { useSpecificVault } from '@/lib/hooks';

export const Route = createFileRoute('/vault/$vault')({
  component: RouteComponent,
})

function RouteComponent() {
  const { vault: vaultName } = Route.useParams();
  const [info, loading] = useSpecificVault(vaultName);
  const navigate = Route.useNavigate();

  if (info === null) {
    if (!loading) {
      // error!
      navigate({
        to: "/vaults",
      });
    }
    return (
      <SidebarLayout>
        <p>Loading...</p>
      </SidebarLayout>
    )
  }


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
          title={info.name}
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

        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <HardDrive className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{formatBytes(info.size)}</div>
                  <div className="text-sm text-base-content/70">Total Size</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title">Vault Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-base-content/70">Directory</label>
                <div className="font-mono text-sm bg-base-200 px-3 py-2 rounded mt-1">
                  {info.location}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-base-content/70">Created</label>
                <div className="text-sm px-3 py-2 mt-1">
                  {formatDate(info.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Directory Browser */}
          <VaultBrowser vaultName={info.name} />
        </div>
      </div>
    </SidebarLayout>
  );
}
