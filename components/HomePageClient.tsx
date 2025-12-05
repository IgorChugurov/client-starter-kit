"use client";

import Link from "next/link";
import { useEntityDefinitions } from "@/components/providers/EntityDefinitionsProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HomePageClient() {
  const { entityDefinitions } = useEntityDefinitions();
  const entityDefinitionsArray = Object.values(entityDefinitions);

  if (entityDefinitionsArray.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome</h1>
        <p className="text-muted-foreground">
          No entities available. Please configure entities in the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome</h1>
        <p className="text-muted-foreground">
          Browse available entities below
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entityDefinitionsArray.map((entityDef) => (
          <Link
            key={entityDef.id}
            href={`/entities/${entityDef.slug}`}
            className="block"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle>{entityDef.name}</CardTitle>
              </CardHeader>
              {entityDef.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {entityDef.description}
                  </p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

