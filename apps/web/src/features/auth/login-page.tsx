import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import { useLoginApiV1AuthLoginPost } from "@alune/api-client/generated";
import { platformName } from "@alune/shared";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const loginMutation = useLoginApiV1AuthLoginPost<Error>({
    mutation: {
      onSuccess: (response) => {
        if (response.status !== 200) {
          throw new Error("Sign in failed");
        }
        auth.setSession(response.data.data.access_token);
        toast.success("Signed in");
        navigate({ to: "/" });
      },
      onError: (error) => {
        toast.error(error.message);
      }
    }
  });

  const form = useForm<LoginFormValues>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: {
      username: "admin",
      password: ""
    }
  });

  function handleSubmit(values: LoginFormValues) {
    loginMutation.mutate({ data: values });
  }

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_24rem] lg:items-center">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-slate-500">Internal admin platform</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">{platformName}</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              A focused workspace for company operations with a protected dashboard, RBAC baseline, internal system
              management pages, and local file attachment workflows.
            </p>
          </div>
        </section>

        <Card className="w-full">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <LogIn className="size-5" />
            </div>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use the local administrator account created by the seed command.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="username">
                  Username
                </label>
                <Input id="username" autoComplete="username" {...form.register("username")} />
                {form.formState.errors.username ? (
                  <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
                {form.formState.errors.password ? (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                ) : null}
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
