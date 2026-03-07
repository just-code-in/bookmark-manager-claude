"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`relative px-3 h-full flex items-center text-sm transition-colors ${
        isActive
          ? "text-foreground font-medium after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:bg-foreground after:rounded-t-full"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 h-12 border-b border-border bg-card">
      <nav className="mx-auto max-w-7xl px-6 flex items-center h-full gap-1">
        <Link
          href="/"
          className="text-sm font-semibold text-foreground mr-6 hover:opacity-80 transition-opacity"
        >
          Bookmark Manager
        </Link>
        <NavLink href="/import">Import</NavLink>
        <NavLink href="/triage">Triage</NavLink>
        <NavLink href="/organize">Organise</NavLink>
        <NavLink href="/search">Search</NavLink>
      </nav>
    </header>
  );
}
