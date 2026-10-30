import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ViewIcon from "~icons/hugeicons/view";
import ViewOffIcon from "~icons/hugeicons/view-off";
import CircleLockIcon from "~icons/hugeicons/circle-lock-01";
import MailIcon from "~icons/hugeicons/mail-01";
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
  onLoginSubmit: (data: LoginFormValues) => void;
}

export default function LoginForm({ onLoginSubmit }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { errors, isSubmitting } = loginForm.formState;

  return (
    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <div className="relative flex items-center">
          <MailIcon className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            className="pl-9"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            {...loginForm.register("email")}
          />
        </div>
        {errors.email && (
          <p id="login-email-error" className="text-xs font-medium text-destructive" role="alert">
            {errors.email.message}
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
        <div className="relative flex items-center">
          <CircleLockIcon className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            className="pl-9 pr-9"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            {...loginForm.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
            aria-pressed={showPassword}
            className="absolute right-3 text-muted-foreground hover:text-foreground flex items-center"
          >
            {showPassword ? <ViewOffIcon className="w-4 h-4" /> : <ViewIcon className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="login-password-error" className="text-xs font-medium text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full mt-2"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? "Вхід..." : "Увійти"}
      </Button>
    </form>
  );
}
