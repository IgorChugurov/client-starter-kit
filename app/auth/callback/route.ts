/**
 * Auth Callback Route
 * Обрабатывает редиректы от:
 * 1. OAuth провайдеров (Google, GitHub и др.) - через code
 * 2. Password reset - через hash с токеном (обрабатывается автоматически Supabase)
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const type = requestUrl.searchParams.get("type");

  const supabase = await createClient();

  // Обработка OAuth (Google, GitHub и др.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth Callback] Error exchanging code:", error);
      // Редиректим на логин с ошибкой
      const errorUrl = new URL("/login", request.url);
      errorUrl.searchParams.set("error", "auth_failed");
      return NextResponse.redirect(errorUrl);
    }

    // После успешного обмена кода на сессию, проверяем что сессия установлена
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("[Auth Callback] Session not found after code exchange");
      const errorUrl = new URL("/login", request.url);
      errorUrl.searchParams.set("error", "auth_failed");
      return NextResponse.redirect(errorUrl);
    }
  }

  // Обработка password reset
  // Supabase автоматически обрабатывает токен из hash при создании клиента
  // Проверяем, что это recovery flow
  if (type === "recovery" || next.includes("reset-password")) {
    // Проверяем, что сессия установлена (токен обработан)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // Токен не обработан или истек
      const errorUrl = new URL("/auth/reset-password", request.url);
      errorUrl.searchParams.set("error", "invalid_token");
      return NextResponse.redirect(errorUrl);
    }
  }

  // Успешная авторизация, редиректим на указанную страницу или главную
  // Используем абсолютный URL для корректного редиректа
  const redirectUrl = new URL(next, requestUrl.origin);
  return NextResponse.redirect(redirectUrl);
}
