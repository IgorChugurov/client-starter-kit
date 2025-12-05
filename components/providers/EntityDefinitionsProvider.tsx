"use client";

import React, { createContext, useContext } from "react";
import type { EntityDefinition } from "@igorchugurov/public-api-sdk";
import type { EntityDefinitionWithFields } from "@/lib/utils/entity-definitions-cache";

interface EntityDefinitionsContextValue {
  entityDefinitions: Record<string, EntityDefinitionWithFields>;
  projectId: string;
}

export const EntityDefinitionsContext = createContext<
  EntityDefinitionsContextValue | undefined
>(undefined);

interface EntityDefinitionsProviderProps {
  children: React.ReactNode;
  entityDefinitions: Record<string, EntityDefinitionWithFields>;
  projectId: string;
}

export function EntityDefinitionsProvider({
  children,
  entityDefinitions,
  projectId,
}: EntityDefinitionsProviderProps) {
  return (
    <EntityDefinitionsContext.Provider value={{ entityDefinitions, projectId }}>
      {children}
    </EntityDefinitionsContext.Provider>
  );
}

export function useEntityDefinitions() {
  const context = useContext(EntityDefinitionsContext);
  if (context === undefined) {
    throw new Error(
      "useEntityDefinitions must be used within EntityDefinitionsProvider"
    );
  }
  return context;
}

/**
 * Хелпер для получения entityDefinition по ID или slug
 */
export function useEntityDefinition(entityDefinitionIdOrSlug: string): {
  entityDefinition: EntityDefinitionWithFields | null;
  fields: EntityDefinitionWithFields["fields"];
} {
  const { entityDefinitions } = useEntityDefinitions();

  // Сначала пытаемся найти по slug (ключ объекта)
  let entityDefinition: EntityDefinitionWithFields | null =
    entityDefinitions[entityDefinitionIdOrSlug] || null;

  // Если не найдено по slug, ищем по ID
  if (!entityDefinition) {
    entityDefinition =
      Object.values(entityDefinitions).find(
        (e) => e.id === entityDefinitionIdOrSlug
      ) || null;
  }

  return {
    entityDefinition,
    fields: entityDefinition?.fields || [],
  };
}
