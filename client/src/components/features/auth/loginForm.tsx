import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HugeiconsIcon } from "@hugeicons/react";
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import EyeOffIcon from "@hugeicons/core-free-icons/EyeOffIcon";
import LockKeyholeIcon from "@hugeicons/core-free-icons/LockKeyholeIcon";
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import { useState } from "react";

import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { Label } from "@ui/label";

const loginSchema = z.object({
  email: z.email("Введіть коректну email-адресу"),
  password: z.string().min(6, "Пароль має містити щонайменше 6 символів"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface Props {
  onLoginSubmit: (data: LoginFormValues) => void
}

export default function LoginForm({
  onLoginSubmit
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <div className="relative">
          <HugeiconsIcon icon={ Mail01Icon } className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-email"
            placeholder="name@example.com"
            className="pl-9"
            {...loginForm.register("email")}
          />
        </div>
        {loginForm.formState.errors.email && (
          <p className="text-xs font-medium text-destructive">
            {loginForm.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Пароль</Label>
          <a href="#forgot" className="text-xs text-primary hover:underline">
            Забули пароль?
          </a>
        </div>
        <div className="relative">
          <HugeiconsIcon icon={ LockKeyholeIcon } className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            className="pl-9 pr-9"
            {...loginForm.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <HugeiconsIcon icon={ EyeOffIcon } className="w-4 h-4" /> : <HugeiconsIcon icon={ ViewIcon } className="w-4 h-4" />}
          </button>
        </div>
        {loginForm.formState.errors.password && (
          <p className="text-xs font-medium text-destructive">
            {loginForm.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full mt-2"
        disabled={loginForm.formState.isSubmitting}
      >
        {loginForm.formState.isSubmitting ? "Вхід..." : "Увійти"}
      </Button>
    </form>
  );
}
