"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, User, LogOut } from "lucide-react";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/chat", icon: MessageSquare, label: "Chat" },
  ];

  return (
    <header className="glass-card m-6 mb-0">
      <nav className="container max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Trip Co-Pilot
            </Link>
            
            <div className="flex gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all duration-300">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
