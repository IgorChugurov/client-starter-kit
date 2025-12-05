import { cache } from "react";
import { cookies } from "next/headers";
import { createServerSDK } from "@igorchugurov/public-api-sdk/server";
import type { EntityDefinition, Field } from "@igorchugurov/public-api-sdk";

/**
 * EntityDefinition с полями (как возвращает getAllEntityDefinitions)
 */
export type EntityDefinitionWithFields = EntityDefinition & {
  fields: Field[];
};

/**
 * Внутренняя функция для загрузки entityDefinitions из БД
 */
async function fetchEntityDefinitions(): Promise<
  Record<string, EntityDefinitionWithFields>
> {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

  if (!projectId) {
    return {};
  }

  try {
    const cookieStore = await cookies();
    const sdk = await createServerSDK(
      projectId,
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Игнорируем ошибки в Server Components
            }
          },
        },
      },
      {
        enableCache: true,
      }
    );

    // Получаем все entityDefinitions с полями
    const configs = await sdk.getAllEntityDefinitions();

    // Преобразуем массив в объект с ключом slug
    const entityDefinitionsMap: Record<string, EntityDefinitionWithFields> = {};
    for (const config of configs) {
      entityDefinitionsMap[config.slug] = config as EntityDefinitionWithFields;
    }

    return entityDefinitionsMap;
  } catch (error) {
    console.error(
      "[EntityDefinitionsCache] Error loading entity definitions:",
      error
    );
    return {};
  }
}

/**
 * Кешированная функция для получения всех entityDefinitions
 * Использует React.cache() для дедупликации запросов в рамках одного запроса
 * (если layout и pages вызывают эту функцию, будет выполнен только один запрос)
 *
 * Кеширование между запросами обеспечивается SDK (enableCache: true)
 */
export const getCachedEntityDefinitions = cache(fetchEntityDefinitions);

/**
 * Получить entityDefinition по slug из кеша
 */
export async function getCachedEntityDefinitionBySlug(
  slug: string
): Promise<EntityDefinitionWithFields | null> {
  const entityDefinitions = await getCachedEntityDefinitions();
  return entityDefinitions[slug] || null;
}
