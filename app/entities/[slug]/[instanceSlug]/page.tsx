import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSDK } from "@igorchugurov/public-api-sdk/server";
import { EntityDetailClient } from "@/components/EntityDetailClient";
import { getCachedEntityDefinitionBySlug } from "@/lib/utils/entity-definitions-cache";

interface EntityDetailPageProps {
  params: Promise<{ slug: string; instanceSlug: string }>;
}

export default async function EntityDetailPage({
  params,
}: EntityDetailPageProps) {
  const { slug, instanceSlug } = await params;
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

  // Получаем cookie handler для Next.js
  const cookieStore = await cookies();

  // Создаем SDK клиент для получения instance
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
  const instance = await sdk.getInstanceBySlug(
    entityDefConfig.id,
    instanceSlug,
    {
      relationsAsIds: false, // Полные объекты для отображения

      loadFiles: true,
    }
  );

  // Получаем instance по slug

  if (!instance) {
    notFound();
  }

  const { fields } = entityDefConfig;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{entityDefConfig.name}</h1>
        {entityDefConfig.description && (
          <p className="text-muted-foreground mt-2">
            {entityDefConfig.description}
          </p>
        )}
      </div>

      <EntityDetailClient
        instance={instance}
        fields={fields}
        entityDefinition={entityDefConfig}
      />
    </div>
  );
}
