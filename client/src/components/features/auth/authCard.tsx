import { useState } from "react";
import LoginForm from "./loginForm";
import RegisterForm from "./registerForm";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/tabs";

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <div className="flex min-h-[500px] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "login" | "register")}
          className="w-full"
        >
          <CardHeader className="space-y-1 pb-4Home05Icon">
            <CardTitle className="text-center text-2xl font-bold">
              {activeTab === "login" ? "Вітаємо знову" : "Створити акаунт"}
            </CardTitle>

            <CardDescription className="text-center">
              {activeTab === "login"
                ? "Увійдіть у свій обліковий запис для продовження"
                : "Заповніть дані нижче для швидкої реєстрації"}
            </CardDescription>

            <TabsList className="grid w-full grid-cols-2 mt-4" variant="line">
              <TabsTrigger value="login">Вхід</TabsTrigger>
              <TabsTrigger value="register">Реєстрація</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="py-5">
            <TabsContent value="login" className="m-0 space-y-4">
              <LoginForm onLoginSubmit={ v => console.log(v) } />
            </TabsContent>

            <TabsContent value="register" className="m-0 space-y-4">
              <RegisterForm onRegisterSubmit={ v => console.log(v) } />
            </TabsContent>
          </CardContent>

          <CardFooter className="flex justify-center border-t py-1 px-5 text-xs text-muted-foreground">
            Натискаючи кнопку, ви погоджуєтеся з нашими Умовами сервісу.
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
}
