import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./AppShell.js";

export function MobileBottomNav() {
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-10 border-t bg-white md:hidden">
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `touch-target flex flex-col items-center justify-center gap-1 py-2 text-xs ${isActive ? "text-accent-700" : "text-neutral-500"}`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
