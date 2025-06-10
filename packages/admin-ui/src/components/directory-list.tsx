import { Folder } from "lucide-react";
import { useState } from 'react';
import { DataTable, EmptyState } from "./table";
import { useVaultFilesystem } from "@/lib/hooks";

interface DirectoryListProps {
  directories: string[];
  root: string;
  onDirectoryClick: (directory: string) => void;
}

export function DirectoryList({ directories, root, onDirectoryClick }: DirectoryListProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-base-content/70">
        Current directory: <span className="font-mono bg-base-200 px-2 py-1 rounded">{root}</span>
      </div>

      <DataTable headers={["Directory", "Type"]}>
        {directories.length === 0 ? (
          <EmptyState message="No directories found" colSpan={2} />
        ) : (
          directories.map((directory) => (
            <tr
              key={directory}
              className="hover cursor-pointer"
              onClick={() => onDirectoryClick(directory)}
            >
              <td>
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-primary" />
                  <span className="font-medium">{directory}</span>
                </div>
              </td>
              <td>
                <span className="badge badge-ghost">Directory</span>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}

export function VaultBrowser({ vaultName }: { vaultName: string }) {
  const files = useVaultFilesystem(vaultName);
  console.log(files);

  const [currentRoot, setCurrentRoot] = useState("");
  const [directories] = useState([
    "src",
    "docs",
    "tests",
    "config",
    "assets"
  ]);

  // Dummy user permissions data
  const handleDirectoryClick = (directory: string) => {
    setCurrentRoot(`${currentRoot}/${directory}`);
  };

  return (
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
  )
}
