/**
 * Утилиты для работы со slug
 * Упрощенная версия для клиентского приложения
 */

/**
 * Генерирует slug из строки
 */
export function generateSlug(name: string): string {
  if (!name || typeof name !== "string") {
    return "item";
  }

  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100) || "item";
}

