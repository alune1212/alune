import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import { loginRoute } from "@/routes/login";
import { useLoginApiV1AuthLoginPost } from "@alune/api-client/generated";
import { platformName } from "@alune/shared";

const loginSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const search = loginRoute.useSearch();

  const loginMutation = useLoginApiV1AuthLoginPost<Error>({
    mutation: {
      onSuccess: (response) => {
        if (response.status !== 200) {
          throw new Error("登录失败");
        }
        auth.setSession(response.data.data.access_token);
        toast.success("登录成功");
        navigate({ to: "/" });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    },
  });

  const form = useForm<LoginFormValues>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: {
      username: "admin",
      password: "",
    },
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
            <p className="text-sm font-medium text-slate-500">RAG 知识库平台</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">
              {platformName}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              面向个人和小团队的私有知识库，集中完成文档入库、索引检索、知识问答和引用溯源。
            </p>
          </div>
        </section>

        <Card className="w-full">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <LogIn className="size-5" />
            </div>
            <CardTitle>登录</CardTitle>
            <CardDescription>
              使用种子命令创建的本地管理员账号。
            </CardDescription>
            {search.expired ? (
              <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                登录状态已过期，请重新登录。
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="username"
                >
                  用户名
                </label>
                <Input
                  id="username"
                  autoComplete="username"
                  {...form.register("username")}
                />
                {form.formState.errors.username ? (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.username.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="password"
                >
                  密码
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...form.register("password")}
                />
                {form.formState.errors.password ? (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "登录中" : "登录"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
