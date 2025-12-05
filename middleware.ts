import { type NextRequest } from "next/server";
import { createAuthMiddleware } from "@igorchugurov/auth-sdk/server";

/**
 * Next.js Middleware для starter-kit
 * 
 * Выполняется на каждом запросе перед рендерингом страницы.
 * 
 * Основные задачи:
 * 1. Обновление сессии Supabase (автоматическое обновление токенов)
 * 2. Проверка авторизации пользователя (без проверки ролей)
 * 3. Редиректы для неавторизованных пользователей
 */
const authMiddleware = createAuthMiddleware({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  publicRoutes: [
    "/login",
    "/logout",
    "/signup",
    "/auth/callback",
    "/auth/reset-password",
    "/api/auth/",
    "/_next/",
    "/favicon.ico",
  ],
  onAuthRequired: ({ pathname }) => {
    // Редирект на логин с сохранением URL для возврата
    return `/login?redirect=${encodeURIComponent(pathname)}`;
  },
  // Не проверяем роли - только авторизацию
  roleCacheTtl: 300, // 5 минут
});

export async function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

