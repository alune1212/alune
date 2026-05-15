import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { getVisibleNavigationItems } from "@/config/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { platformName } from "@alune/shared";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type MobileNavigationProps = {
  permissions: readonly string[];
};

function MobileNavigation({ permissions }: MobileNavigationProps) {
  const visibleNavigationItems = getVisibleNavigationItems(permissions);

  return (
    <div className="space-y-2 px-1">
      {visibleNavigationItems.map((item) =>
        item.to ? (
          <Button key={item.label} variant="ghost" className="w-full justify-start" asChild>
            <Link to={item.to}>
              <item.icon className="size-4" />
              {item.label}
            </Link>
          </Button>
        ) : (
          <Button key={item.label} variant="ghost" className="w-full justify-start text-slate-400" disabled>
            <item.icon className="size-4" />
            {item.label}
          </Button>
        )
      )}
    </div>
  );
}

export function Topbar() {
  const auth = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    auth.logout();
    navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>{platformName}</SheetTitle>
            </SheetHeader>
            <MobileNavigation permissions={auth.user?.permissions ?? []} />
          </SheetContent>
        </Sheet>
        <div>
          <p className="text-sm font-semibold text-slate-950">Company Admin</p>
          <p className="text-xs text-slate-500">MVP workspace</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
          Local
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label="Open account menu">
              <UserCircle className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{auth.user?.username ?? "Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
