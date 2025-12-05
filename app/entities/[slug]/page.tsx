import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSDK } from "@igorchugurov/public-api-sdk/server";
import { EntityListClient } from "@/components/EntityListClient";
import { getCachedEntityDefinitionBySlug } from "@/lib/utils/entity-definitions-cache";

interface EntityListPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EntityListPage({ params }: EntityListPageProps) {
  const { slug } = await params;
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;

  if (!projectId) {
    notFound();
  }

  // Используем кеш для получения entityDefinition
  // Данные будут взяты из кеша, если они уже были загружены в layout.tsx
  const entityDefConfig = await getCachedEntityDefinitionBySlug(slug);

  if (!entityDefConfig) {
    notFound();
  }

  const { fields, ...entityDefinition } = entityDefConfig;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{entityDefinition.name}</h1>
        {entityDefinition.description && (
          <p className="text-muted-foreground mt-2">
            {entityDefinition.description}
          </p>
        )}
      </div>

      <EntityListClient
        projectId={projectId}
        entityDefinition={entityDefinition}
        fields={fields}
        entityDefinitionSlug={slug}
      />
    </div>
  );
}
