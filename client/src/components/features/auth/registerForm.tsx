import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ViewIcon from "~icons/hugeicons/view";
import ViewOffIcon from "~icons/hugeicons/view-off";
import CircleLockIcon from "~icons/hugeicons/circle-lock-01";
import MailIcon from "~icons/hugeicons/mail-01";
import UserIcon from "~icons/hugeicons/user-02";
import { useState } from "react";

import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { Label } from "@ui/label";

const registerSchema = z
  .object({
    name: z.string().min(2, "Ім'я має містити щонайменше 2 символи"),
    email: z.email("Введіть коректну email-адресу"),
    password: z.string().min(6, "Пароль має містити щонайменше 6 символів"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не збігаються",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface Props {
  onRegisterSubmit: (data: RegisterFormValues) => void;
}

export default function RegisterForm({ onRegisterSubmit }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const { errors, isSubmitting } = registerForm.formState;

  return (
    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="register-name">Ім'я</Label>
        <div className="relative flex items-center">
          <UserIcon className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="register-name"
            placeholder="Олександр"
            className="pl-9"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "register-name-error" : undefined}
            {...registerForm.register("name")}
          />
        </div>
        {errors.name && (
          <p id="register-name-error" className="text-xs font-medium text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <div className="relative flex items-center">
          <MailIcon className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="register-email"
            type="email"
            placeholder="name@example.com"
            className="pl-9"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            {...registerForm.register("email")}
          />
        </div>
        {errors.email && (
          <p id="register-email-error" className="text-xs font-medium text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Пароль</Label>
        <div className="relative flex items-center">
          <CircleLockIcon className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            className="pl-9 pr-9"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "register-password-error" : undefined}
            {...registerForm.register("password")}
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
          <p id="register-password-error" className="text-xs font-medium text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Підтвердження пароля</Label>
        <div className="relative flex items-center">
          <CircleLockIcon className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="register-confirm-password"
            type={showPassword ? "text" : "password"}
            className="pl-9 pr-9"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
            {...registerForm.register("confirmPassword")}
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
        {errors.confirmPassword && (
          <p id="register-confirm-password-error" className="text-xs font-medium text-destructive" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full mt-2"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? "Створення..." : "Зареєструватися"}
      </Button>
    </form>
  );
}
