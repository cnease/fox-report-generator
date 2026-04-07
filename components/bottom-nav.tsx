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
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-200 bg-white/98 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto w-full max-w-md px-3 pb-2 pt-2">
        <div className="relative grid grid-cols-3 items-center rounded-2xl bg-gray-100 p-1.5">
          <div
            className="absolute bottom-1.5 top-1.5 w-[calc(33.333%-0.5rem)] rounded-2xl bg-white shadow-sm transition-all duration-300"
            style={{
              left: `calc(${Math.max(activeIndex, 0) * 33.333}% + 0.375rem)`,
            }}
          />

          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative z-10 flex min-h-[72px] flex-col items-center justify-center rounded-2xl px-3 py-2 transition-all duration-200 ${
                  isActive ? "text-black" : "text-gray-500"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 2}
                  className="mb-1.5"
                />
                <span
                  className={`text-[12px] leading-none ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
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