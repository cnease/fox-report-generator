"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pencil, FileText, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Generate", icon: Pencil },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/account", label: "Account", icon: User },
  ];

  const activeIndex = tabs.findIndex((tab) => tab.href === pathname);

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-md px-3 py-2">
        <div className="relative grid grid-cols-3 items-center rounded-2xl bg-gray-100 p-1">
          <div
            className="absolute top-1 bottom-1 w-[calc(33.333%-0.33rem)] rounded-xl bg-white shadow-sm transition-all duration-300"
            style={{
              left: `calc(${Math.max(activeIndex, 0) * 33.333}% + 0.25rem)`,
            }}
          />

          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative z-10 flex min-h-[64px] flex-col items-center justify-center rounded-xl px-3 py-2 text-xs transition-all duration-200 ${
                  isActive ? "text-black" : "text-gray-500"
                }`}
              >
                <Icon size={18} className="mb-1" />
                <span className={isActive ? "font-semibold" : "font-medium"}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}