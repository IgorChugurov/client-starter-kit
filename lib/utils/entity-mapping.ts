/**
 * Утилиты для маппинга slug → EntityDefinition и Instance
 */

import type { EntityDefinition } from "@igorchugurov/public-api-sdk";

/**
 * Найти EntityDefinition по slug
 */
export function findEntityDefinitionBySlug(
  entityDefinitions: EntityDefinition[],
  slug: string
): EntityDefinition | null {
  return entityDefinitions.find((ed) => ed.slug === slug) || null;
}

