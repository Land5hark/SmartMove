"use client";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { BookOpen, Home, Package, ScanLine, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/boxes", icon: Package, label: "Boxes" },
  { href: "/add-box", icon: null, label: "Scan", isScan: true },
  { href: "/inventory", icon: BookOpen, label: "Inventory" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-end justify-around px-4 pb-safe pt-2 pb-3">
        {navItems.map((item) => {
          if (item.isScan) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 -mt-4"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-pink-cyan glow-pink shadow-lg transition-transform active:scale-95">
                  <ScanLine className="h-6 w-6 text-midnight" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {item.label}
                </span>
              </Link>
            );
          }

          const Icon = item.icon!;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-1"
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Profile / Sign Out */}
        <button
          type="button"
          onClick={user ? handleSignOut : () => router.push("/login")}
          className="flex flex-col items-center gap-1 py-1"
        >
          <User
            className={cn(
              "h-5 w-5 transition-colors",
              pathname === "/profile"
                ? "text-primary"
                : "text-muted-foreground"
            )}
          />
          <span className="text-[10px] font-medium text-muted-foreground">
            {user ? "Sign Out" : "Sign In"}
          </span>
        </button>
      </div>
    </nav>
  );
}
