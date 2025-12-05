/**
 * Хук для загрузки options для relation-полей
 * Использует SDK для загрузки данных через React Query
 *
 * Все компоненты, использующие один и тот же relatedEntityDefinitionId,
 * будут использовать один и тот же запрос и кэш
 */

import { useQuery } from "@tanstack/react-query";
import { createClientSDK } from "@igorchugurov/public-api-sdk";
import { loadEntityOptions } from "./load-entity-options";
import type { EntityOptionsData, Option } from "./load-entity-options";

/**
 * Хук для загрузки options для relation-поля
 *
 * @param projectId - ID проекта
 * @param relatedEntityDefinitionId - ID связанной сущности
 * @param options - Опции для React Query (enabled и т.д.)
 * @returns Данные options, состояние загрузки и ошибки
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useEntityOptions(projectId, relatedEntityDefinitionId);
 * const options = data?.options || [];
 * ```
 */
export function useEntityOptions(
  projectId: string,
  relatedEntityDefinitionId: string,
  options?: { enabled?: boolean }
) {
  const sdk = createClientSDK(projectId, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });

  return useQuery({
    queryKey: ["entity-options", projectId, relatedEntityDefinitionId],
    queryFn: () => loadEntityOptions(relatedEntityDefinitionId, sdk),
    enabled: options?.enabled !== false && !!relatedEntityDefinitionId,
    staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
    gcTime: 10 * 60 * 1000, // 10 минут - кэш хранится в памяти
    retry: 1, // повторить 1 раз при ошибке
    retryDelay: 1000, // задержка перед повтором (1 секунда)
  });
}

export type { Option, EntityOptionsData } from "./load-entity-options";

