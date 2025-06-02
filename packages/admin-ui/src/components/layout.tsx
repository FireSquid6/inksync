import { useState } from 'react';
import { 
  Home, 
  Folder, 
  Users, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Link } from "@tanstack/react-router";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, link: "/" },
    { id: 'vaults', label: 'Vaults', icon: Folder, link: "/vaults" },
    { id: 'users', label: 'Users', icon: Users, link: "/users" },
    { id: 'profile', label: 'Profile', icon: User, link: "/profile" },
  ];

  return (
    <div className="drawer lg:drawer-open">
      <input 
        id="drawer-toggle" 
        type="checkbox" 
        className="drawer-toggle" 
        checked={sidebarOpen}
        onChange={(e) => setSidebarOpen(e.target.checked)}
      />
      
      {/* Main content */}
      <div className="drawer-content flex flex-col">
        {/* Mobile header */}
        <div className="navbar bg-base-100 lg:hidden">
          <div className="flex-none">
            <label htmlFor="drawer-toggle" className="btn btn-square btn-ghost">
              <Menu className="w-6 h-6" />
            </label>
          </div>
          <div className="flex-1">
            <span className="text-xl font-bold">File Sync Admin</span>
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1 bg-base-200 p-4 min-h-screen">
          {children}
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side">
        <label htmlFor="drawer-toggle" className="drawer-overlay"></label>
        <aside className="w-64 min-h-full bg-base-100 text-base-content flex flex-col">
          {/* Logo/Header */}
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">File Sync Admin</h1>
              <button 
                className="btn btn-ghost btn-sm lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      to={item.link}
                      className={`btn btn-ghost w-full justify-start`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sign out button */}
          <div className="p-4 border-t border-base-300">
            <button className="btn btn-ghost w-full justify-start text-error hover:bg-error hover:text-error-content">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
