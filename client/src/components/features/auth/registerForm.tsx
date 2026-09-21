import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HugeiconsIcon } from "@hugeicons/react";
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import EyeOffIcon from "@hugeicons/core-free-icons/EyeOffIcon";
import LockKeyholeIcon from "@hugeicons/core-free-icons/LockKeyholeIcon";
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import User02Icon from "@hugeicons/core-free-icons/User02Icon";
import { useState } from "react";

import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { Label } from "@ui/label";
import { useForm } from "react-hook-form";

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
  onRegisterSubmit: (data: RegisterFormValues) => void
}

export default function RegisterForm({
  onRegisterSubmit
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  return (
    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-name">Ім'я</Label>
        <div className="relative">
          <HugeiconsIcon icon={ User02Icon } className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-name"
            placeholder="Олександр"
            className="pl-9"
            {...registerForm.register("name")}
          />
        </div>
        {registerForm.formState.errors.name && (
          <p className="text-xs font-medium text-destructive">
            {registerForm.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <div className="relative">
          <HugeiconsIcon icon={ Mail01Icon } className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-email"
            placeholder="name@example.com"
            className="pl-9"
            {...registerForm.register("email")}
          />
        </div>
        {registerForm.formState.errors.email && (
          <p className="text-xs font-medium text-destructive">
            {registerForm.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Пароль</Label>
        <div className="relative">
          <HugeiconsIcon icon={ LockKeyholeIcon } className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            className="pl-9 pr-9"
            {...registerForm.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <HugeiconsIcon icon={ EyeOffIcon } className="w-4 h-4" /> : <HugeiconsIcon icon={ ViewIcon } className="w-4 h-4" />}
          </button>
        </div>
        {registerForm.formState.errors.password && (
          <p className="text-xs font-medium text-destructive">
            {registerForm.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Підтвердження пароля</Label>
        <div className="relative">
          <HugeiconsIcon icon={ LockKeyholeIcon } className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-confirm-password"
            type={showPassword ? "text" : "password"}
            className="pl-9"
            {...registerForm.register("confirmPassword")}
          />
        </div>
        {registerForm.formState.errors.confirmPassword && (
          <p className="text-xs font-medium text-destructive">
            {registerForm.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full mt-2"
        disabled={registerForm.formState.isSubmitting}
      >
        {registerForm.formState.isSubmitting ? "Створення..." : "Зареєструватися"}
      </Button>
    </form>
  );
}
