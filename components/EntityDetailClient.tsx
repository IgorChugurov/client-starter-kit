"use client";

import type {
  EntityDefinition,
  Field,
  EntityInstanceWithFields,
  EntityFile,
} from "@igorchugurov/public-api-sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Download, File as FileIcon } from "lucide-react";

interface EntityDetailClientProps {
  instance: EntityInstanceWithFields;
  fields: Field[];
  entityDefinition: EntityDefinition;
}

/**
 * Получает значение для отображения из связанного экземпляра
 */
function getRelatedInstanceDisplayValue(item: any): string {
  if (!item || typeof item !== "object") return "-";

  const systemFields = new Set([
    "id",
    "entityDefinitionId",
    "projectId",
    "createdAt",
    "updatedAt",
  ]);

  const standardFields = ["name", "Name", "title", "Title"];
  for (const fieldName of standardFields) {
    if (item[fieldName] !== undefined && item[fieldName] !== null) {
      const value = String(item[fieldName]).trim();
      if (value) return value;
    }
  }

  for (const [key, value] of Object.entries(item)) {
    if (!systemFields.has(key) && typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return item.id || "-";
}

/**
 * Форматирует значение релейшена для отображения
 */
function formatRelationValue(
  value: any,
  relationDbType?: "manyToOne" | "oneToOne" | "manyToMany" | "oneToMany"
): React.ReactNode {
  if (relationDbType === "manyToOne" || relationDbType === "oneToOne") {
    if (!value || typeof value !== "object")
      return <span className="text-muted-foreground">—</span>;
    if (Array.isArray(value)) {
      const item = value[0];
      if (!item) return <span className="text-muted-foreground">—</span>;
      return <span>{getRelatedInstanceDisplayValue(item)}</span>;
    }
    return <span>{getRelatedInstanceDisplayValue(value)}</span>;
  }

  if (!Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const names = value
    .map((item: any) => getRelatedInstanceDisplayValue(item))
    .filter((name) => name && name !== "-");

  if (names.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-1">
      {names.map((name: string, idx: number) => (
        <div key={idx}>{name}</div>
      ))}
    </div>
  );
}

export function EntityDetailClient({
  instance,
  fields,
  entityDefinition,
}: EntityDetailClientProps) {
  // Фильтруем поля для отображения (только те, что не системные)
  const displayFields = fields.filter(
    (f) =>
      ![
        "id",
        "slug",
        "entityDefinitionId",
        "projectId",
        "createdAt",
        "updatedAt",
      ].includes(f.name)
  );

  // Группируем поля по секциям
  const fieldsBySection = displayFields.reduce((acc, field) => {
    const section = field.sectionIndex || 0;
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(field);
    return acc;
  }, {} as Record<number, Field[]>);

  const renderFieldValue = (field: Field, value: unknown) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }

    // Обработка релейшенов
    const isRelation =
      field.relatedEntityDefinitionId &&
      (field.dbType === "manyToMany" ||
        field.dbType === "manyToOne" ||
        field.dbType === "oneToMany" ||
        field.dbType === "oneToOne");

    if (isRelation) {
      return formatRelationValue(
        value,
        field.dbType as "manyToOne" | "oneToOne" | "manyToMany" | "oneToMany"
      );
    }

    // Обработка изображений
    if (field.type === "images") {
      if (!Array.isArray(value) || value.length === 0) {
        return <span className="text-muted-foreground">—</span>;
      }
      // value уже содержит массив EntityFile объектов
      const files = value as EntityFile[];
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="relative aspect-square rounded-md overflow-hidden border"
            >
              <Image
                src={file.fileUrl}
                alt={file.fileName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      );
    }

    // Обработка файлов
    if (field.type === "files") {
      if (!Array.isArray(value) || value.length === 0) {
        return <span className="text-muted-foreground">—</span>;
      }
      // value уже содержит массив EntityFile объектов
      const files = value as EntityFile[];
      return (
        <div className="space-y-2">
          {files.map((file) => (
            <a
              key={file.id}
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={file.fileName}
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <FileIcon className="h-4 w-4" />
              <span>{file.fileName}</span>
              <Download className="h-4 w-4" />
            </a>
          ))}
        </div>
      );
    }

    // Обработка дат
    if (field.dbType === "timestamptz" && typeof value === "string") {
      return new Date(value).toLocaleString();
    }

    // Обработка boolean
    if (field.dbType === "boolean") {
      return value ? "Yes" : "No";
    }

    // Обработка массивов (не релейшенов)
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    return String(value);
  };

  return (
    <div className="space-y-6">
      {Object.entries(fieldsBySection)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([sectionIndex, sectionFields]) => {
          const sectionTitle =
            sectionIndex === "0"
              ? entityDefinition.titleSection0
              : sectionIndex === "1"
              ? entityDefinition.titleSection1
              : sectionIndex === "2"
              ? entityDefinition.titleSection2
              : sectionIndex === "3"
              ? entityDefinition.titleSection3
              : null;

          return (
            <Card key={sectionIndex}>
              {sectionTitle && (
                <CardHeader>
                  <CardTitle>{sectionTitle}</CardTitle>
                </CardHeader>
              )}
              <CardContent className="space-y-4">
                {sectionFields.map((field) => {
                  const value = (instance as any)[field.name];
                  return (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {field.label}
                      </Label>
                      <div className="text-sm">
                        {renderFieldValue(field, value)}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
