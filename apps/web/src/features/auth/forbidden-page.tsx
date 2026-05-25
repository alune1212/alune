import { ShieldAlert } from "lucide-react";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center text-center">
        <ShieldAlert className="size-10 text-slate-400" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold text-slate-950">Access denied</h1>
        <p className="mt-2 text-sm text-slate-600">Your account does not have permission to view this page.</p>
      </div>
    </div>
  );
}
