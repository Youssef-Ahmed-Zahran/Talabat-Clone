import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0 || pathnames[0] === "dashboard") return null;

  return (
    <nav className="flex items-center gap-1.5 mb-6 overflow-x-auto no-scrollbar py-0.5">
      <Link
        to="/dashboard"
        className="flex items-center gap-1.5 text-gray-400 hover:text-brand transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          Dashboard
        </span>
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

        // Skip IDs in breadcrumbs or format them
        const isId = /^\d+$/.test(name) || name.length > 20;
        const displayName = isId
          ? "Details"
          : name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " ");

        return (
          <div key={name} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
            {isLast ? (
              <span className="text-gray-900 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded-md">
                {displayName}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="text-gray-400 hover:text-brand transition-colors text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
              >
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
