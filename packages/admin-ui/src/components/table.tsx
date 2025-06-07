import type { ReactNode } from "react";
import { Search } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-base-content/70 mt-1">{description}</p>
      </div>
      {action && action}
    </div>
  );
}

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ searchTerm, onSearchChange, placeholder = "Search..." }: SearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="form-control flex-1">
        <label className="input">
          <span className="bg-base-200">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

interface DataTableProps {
  headers: string[];
  children: ReactNode;
  emptyMessage?: string;
}

export function DataTable({ headers, children, emptyMessage = "No data found" }: DataTableProps) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  colSpan: number;
}

export function EmptyState({ message, colSpan }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-8">
        <div className="text-base-content/50">{message}</div>
      </td>
    </tr>
  );
}

interface ResultsCountProps {
  searchTerm: string;
  filteredCount: number;
  totalCount: number;
  itemName: string;
}

export function ResultsCount({ searchTerm, filteredCount, totalCount, itemName }: ResultsCountProps) {
  if (!searchTerm) return null;
  
  return (
    <div className="text-sm text-base-content/70 mt-4">
      Showing {filteredCount} of {totalCount} {itemName}
    </div>
  );
}

// Utility functions that can be reused
export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const formatDate = (timestamp: number | Date) => {
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
