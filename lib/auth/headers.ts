/**
 * Получение пользователя из headers (установленных middleware)
 *
 * Middleware устанавливает отдельные заголовки для каждого поля пользователя:
 * - x-user-id
 * - x-user-email
 * - x-user-first-name
 * - x-user-last-name
 * - x-user-avatar
 * - x-user-role
 */

import { headers } from "next/headers";
import type { User } from "@igorchugurov/auth-sdk";

export async function getServerUserFromHeaders(): Promise<User | null> {
  const headersList = await headers();

  // Сначала проверяем, есть ли заголовок x-user (старый формат)
  const userHeader = headersList.get("x-user");
  if (userHeader) {
    try {
      return JSON.parse(userHeader) as User;
    } catch {
      // Если не удалось распарсить, продолжаем собирать из отдельных заголовков
    }
  }

  // Собираем пользователя из отдельных заголовков
  const userId = headersList.get("x-user-id");
  if (!userId) {
    return null;
  }

  const email = headersList.get("x-user-email");
  const firstName = headersList.get("x-user-first-name");
  const lastName = headersList.get("x-user-last-name");
  const avatar = headersList.get("x-user-avatar");
  const role = headersList.get("x-user-role");

  // Собираем объект пользователя
  const user: User = {
    id: userId,
    email: email || undefined,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    avatar: avatar || undefined,
    role: role || undefined,
  } as User;

  return user;
}
