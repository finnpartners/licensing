import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthMutations } from "@/hooks/use-api-wrappers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuthMutations();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (data: LoginForm) => {
    login.mutate({ data });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 mx-4">
        <h2 className="text-3xl font-display font-bold text-slate-950 mb-2">Welcome back</h2>
        <p className="text-slate-500 mb-8">Sign in to the admin dashboard</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
            <Input 
              {...register("username")} 
              placeholder="Enter your username" 
              className={errors.username ? "border-rose-300 focus-visible:ring-rose-500/10 focus-visible:border-rose-500" : ""}
            />
            {errors.username && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <Input 
              type="password" 
              {...register("password")} 
              placeholder="••••••••" 
              className={errors.password ? "border-rose-300 focus-visible:ring-rose-500/10 focus-visible:border-rose-500" : ""}
            />
            {errors.password && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full text-base h-12 mt-4" disabled={login.isPending}>
            {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </Button>
        </form>
        
        <div className="mt-8 text-center text-sm text-slate-400">
          Internal system. Authorized access only.
        </div>
      </div>
    </div>
  );
}
