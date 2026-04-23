import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  HardHat,
  LayoutDashboard,
  Users,
  Clock,
  Map,
  BarChart3,
  ShieldCheck,
  Settings
} from "lucide-react";
import UserProfileDropdown from "../navigation/UserProfileDropdown";

const Header = () => {
  const { user } = useAuth();

  const roleBasedLinks = {
    ADMIN: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/users", label: "User Mgmt", icon: ShieldCheck },
      { to: "/sites", label: "Site Mgmt", icon: Map },
      { to: "/deployments", label: "Deployments", icon: HardHat },
      { to: "/reporting", label: "Reporting & Payroll", icon: BarChart3 },
      { to: "/settings", label: "System Control", icon: Settings },
      { to: "/analytics", label: "Security Logs", icon: ShieldCheck },
    ],
    HR: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/labour", label: "Labour Directory", icon: Users },
      { to: "/deployments", label: "Workforce Deploy", icon: HardHat },
      { to: "/reporting", label: "Payroll & Reporting", icon: BarChart3 },
    ],
    SUPERVISOR: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/attendance", label: "Attendance Terminal", icon: Clock },
      { to: "/deployments", label: "My Deployments", icon: Map },
    ],
  };

  const links = user ? roleBasedLinks[user.role] || [] : [];

  return (
    <header className="flex justify-between items-center px-8 py-4 border-b-2 border-slate-900 bg-white shrink-0 z-30">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 p-1.5">
            <HardHat className="text-orange-500 h-6 w-6" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">
            CONSTRUCT<span className="text-orange-600">SYNC</span>
          </span>
        </div>

        {/* Dynamic Navigation */}
        {user && !user.isFirstLogin && (
          <nav className="hidden lg:flex items-center space-x-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `
                  flex items-center space-x-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all
                  ${
                    isActive
                      ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }
                `}
              >
                <link.icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center space-x-6">
        {user ? (
          <UserProfileDropdown />
        ) : (
          <button className="text-[10px] font-bold tracking-widest text-slate-900 hover:text-orange-600 uppercase border-b-2 border-transparent hover:border-orange-600 transition-all">
            Support Portal
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
