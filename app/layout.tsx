import { Geist, Geist_Mono } from "next/font/google";
import React, { type ReactNode } from "react";
import { headers } from "next/headers";

import { cn } from "@/lib/utils";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { EntityDefinitionsProvider } from "@/components/providers/EntityDefinitionsProvider";
import Navbar from "@/components/Navbar";
import { AppSidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getServerUserFromHeaders } from "@/lib/auth/headers";
import { getCachedEntityDefinitions } from "@/lib/utils/entity-definitions-cache";

const GeistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const GeistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Получаем пользователя из headers (установленных middleware)
  const user = await getServerUserFromHeaders();

  // Публичные маршруты
  const publicRoutes = [
    "/login",
    "/logout",
    "/signup",
    "/auth/reset-password",
    "/auth/callback",
  ];

  const isPublicRoute =
    publicRoutes.some((route) => pathname.startsWith(route)) && !user;

  // Загружаем entityDefinitions для авторизованных пользователей
  // Используем кеш, который будет переиспользован в SSR страницах
  let entityDefinitionsMap: Record<string, any> = {};
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;

  if (user && projectId) {
    try {
      entityDefinitionsMap = await getCachedEntityDefinitions();
    } catch (error) {
      console.error("[Layout] Error loading entity definitions:", error);
      // Не блокируем рендер, если не удалось загрузить
    }
  }

  return (
    <html
      lang="en"
      className={cn(
        GeistSans.variable,
        GeistMono.variable,
        "bg-background text-foreground"
      )}
      suppressHydrationWarning
    >
      <body className={isPublicRoute ? "" : "min-h-screen"}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider initialUser={user}>
              {isPublicRoute ? (
                children
              ) : (
                <EntityDefinitionsProvider
                  entityDefinitions={entityDefinitionsMap}
                  projectId={projectId}
                >
                  <SidebarProvider defaultOpen={true}>
                    <AppSidebar />
                    <main className="w-full">
                      <Navbar />
                      <div className="p-4">{children}</div>
                    </main>
                  </SidebarProvider>
                </EntityDefinitionsProvider>
              )}
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
