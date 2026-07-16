"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { useSidebar } from "./SidebarContext";

const navItems = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
      </svg>
    ),
  },
  {
    key: "portfolio",
    href: "/dashboard/portfolio",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const t = useTranslations("nav");
  const appName = useTranslations("common")("appName");
  const locale = useLocale();
  const pathname = usePathname();
  const { isMobileOpen, isCollapsed, closeMobile, toggleCollapsed } = useSidebar();

  return (
    <aside
      className={[
        "bg-paper-2 border-r border-line flex flex-col shrink-0",
        "fixed inset-y-0 left-0 z-30 w-72",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:relative md:inset-auto md:z-auto md:translate-x-0",
        isCollapsed ? "md:w-16" : "md:w-60",
        "transition-all duration-300 ease-in-out",
      ].join(" ")}
    >
      {/* Logo — height matches top header */}
      <div className="h-16 px-3 flex items-center border-b border-line shrink-0">
        <div className={`flex items-center w-full ${isCollapsed ? "justify-center" : "justify-between px-1"}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            {!isCollapsed && (
              <span className="font-serif text-sm font-bold text-ink tracking-tight truncate">{appName}</span>
            )}
          </div>
          {/* Mobile close button */}
          <button
            onClick={closeMobile}
            aria-label="메뉴 닫기"
            className="md:hidden text-muted hover:text-ink p-1.5 rounded-lg hover:bg-paper transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isExact = pathname === item.href || pathname.endsWith(item.href);
          const isParent = item.href !== "/dashboard" && pathname.includes(item.href);
          const active = isExact || isParent;

          return (
            <Link
              key={item.key}
              href={`/portfolio/${locale}${item.href}`}
              onClick={closeMobile}
              title={isCollapsed ? t(item.key as "dashboard") : undefined}
              className={[
                "flex items-center py-2.5 rounded-xl text-sm font-medium transition-all",
                isCollapsed ? "justify-center px-2" : "gap-3 px-3",
                active
                  ? "bg-accent-soft text-accent border border-accent/25"
                  : "text-muted hover:bg-paper hover:text-ink border border-transparent",
              ].join(" ")}
            >
              <span className={`shrink-0 ${active ? "text-accent" : "text-muted"}`}>
                {item.icon}
              </span>
              {!isCollapsed && <span>{t(item.key as "dashboard")}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-line space-y-0.5 shrink-0">
        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleCollapsed}
          title={isCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
          className={[
            "hidden md:flex w-full items-center py-2.5 rounded-xl text-sm font-medium",
            "text-muted hover:bg-paper hover:text-ink-soft transition-all border border-transparent",
            isCollapsed ? "justify-center px-2" : "gap-3 px-3",
          ].join(" ")}
        >
          <svg
            className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!isCollapsed && <span>접기</span>}
        </button>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/portfolio" })}
          title={isCollapsed ? t("logout") : undefined}
          className={[
            "w-full flex items-center py-2.5 rounded-xl text-sm font-medium",
            "text-muted hover:bg-paper hover:text-ink-soft transition-all border border-transparent",
            isCollapsed ? "justify-center px-2" : "gap-3 px-3",
          ].join(" ")}
        >
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span>{t("logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
