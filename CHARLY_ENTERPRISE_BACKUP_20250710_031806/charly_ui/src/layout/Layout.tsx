import { Link, useLocation } from "react-router-dom";

const tabs = [
  { path: "/", name: "Dashboard" },
  { path: "/portfolio", name: "Portfolio" },
  { path: "/appeals", name: "Appeals" },
  { path: "/filing", name: "Filing" },
  { path: "/reports", name: "Reports" },
  { path: "/settings", name: "Settings" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-gray-900 text-white p-4 shadow-xl">
        <div className="text-2xl font-bold mb-8 text-white">🏢 CHARLY</div>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                location.pathname === tab.path
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}