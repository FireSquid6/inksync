import { Folder, FolderOpen } from "lucide-react";
import { DataTable, EmptyState } from "./table";

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