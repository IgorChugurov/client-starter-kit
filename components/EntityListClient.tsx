"use client";

import { useMemo, useState, useDeferredValue } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { createClientSDK } from "@igorchugurov/public-api-sdk";
import type { EntityDefinition, Field } from "@igorchugurov/public-api-sdk";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { FilterField } from "./FilterField";
import type { FilterMode } from "./DataTableFacetedFilter";

interface EntityListClientProps {
  projectId: string;
  entityDefinition: EntityDefinition;
  fields: Field[];
  entityDefinitionSlug: string;
}

/**
 * Получает значение для отображения из связанного экземпляра
 * Ищет поле для отображения в следующем порядке:
 * 1. Стандартные поля: name, Name, title, Title
 * 2. Первое строковое поле (кроме служебных)
 * 3. ID
 */
function getRelatedInstanceDisplayValue(item: any): string {
  if (!item || typeof item !== "object") return "-";

  // Служебные поля, которые не должны использоваться для отображения
  const systemFields = new Set([
    "id",
    "entityDefinitionId",
    "projectId",
    "createdAt",
    "updatedAt",
  ]);

  // 1. Сначала ищем стандартные поля (с разными регистрами)
  const standardFields = ["name", "Name", "title", "Title"];
  for (const fieldName of standardFields) {
    if (item[fieldName] !== undefined && item[fieldName] !== null) {
      const value = String(item[fieldName]).trim();
      if (value) return value;
    }
  }

  // 2. Ищем первое строковое поле (кроме служебных)
  for (const [key, value] of Object.entries(item)) {
    if (!systemFields.has(key) && typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  // 3. В крайнем случае используем ID
  return item.id || "-";
}

/**
 * Форматирует значение поля-связи для отображения в таблице
 *
 * @param value - Значение поля (объект или массив объектов)
 * @param relationDbType - Тип связи (manyToOne, oneToOne, manyToMany, oneToMany)
 * @returns Строка для отображения
 */
function formatRelationValue(
  value: any,
  relationDbType?: "manyToOne" | "oneToOne" | "manyToMany" | "oneToMany"
): string {
  // Для одиночных связей (manyToOne, oneToOne) - значение может быть объектом
  if (relationDbType === "manyToOne" || relationDbType === "oneToOne") {
    if (!value || typeof value !== "object") return "-";
    // Если пришел массив (старый формат), берем первый элемент
    if (Array.isArray(value)) {
      const item = value[0];
      if (!item) return "-";
      return getRelatedInstanceDisplayValue(item);
    }
    return getRelatedInstanceDisplayValue(value);
  }

  // Для множественных связей (manyToMany, oneToMany) - массив объектов
  if (!Array.isArray(value) || value.length === 0) return "-";

  const names = value
    .map((item: any) => getRelatedInstanceDisplayValue(item))
    .filter((name) => name && name !== "-");

  if (names.length === 0) return "-";

  // Ограничиваем количество отображаемых имен
  const maxDisplayNames = 3;
  if (names.length <= maxDisplayNames) {
    return `${value.length} (${names.join(", ")})`;
  }

  const displayedNames = names.slice(0, maxDisplayNames).join(", ");
  const remaining = names.length - maxDisplayNames;
  return `${value.length} (${displayedNames}, +${remaining} more)`;
}

export function EntityListClient({
  projectId,
  entityDefinition,
  fields,
  entityDefinitionSlug,
}: EntityListClientProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [filterModes, setFilterModes] = useState<Record<string, FilterMode>>(
    {}
  );
  const pageSize = entityDefinition.pageSize || 20;

  // Отложенное значение для поиска (debounce эффект)
  const deferredSearch = useDeferredValue(search);

  // Создаем SDK клиент
  const sdk = useMemo(
    () =>
      createClientSDK(projectId, {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }),
    [projectId]
  );

  // Загружаем данные через React Query
  const { data, isFetching, error } = useQuery({
    queryKey: [
      "entity-instances",
      projectId,
      entityDefinition.id,
      page,
      deferredSearch,
      filters,
      filterModes,
    ],
    queryFn: async () => {
      return await sdk.getInstances(entityDefinition.id, {
        page,
        limit: pageSize,
        search: deferredSearch || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        relationFilterModes:
          Object.keys(filterModes).length > 0 ? filterModes : undefined,
      });
    },
    placeholderData: keepPreviousData,
  });

  // Определяем колонки для отображения (только поля с displayInTable: true)
  const displayFields = useMemo(
    () => fields.filter((f) => f.displayInTable).slice(0, 5), // Максимум 5 колонок
    [fields]
  );

  // Получаем поля, которые можно фильтровать
  const filterableFields = useMemo(
    () =>
      fields.filter((field) => {
        if (!field.filterableInList) return false;

        // Для relation-полей достаточно наличия relatedEntityDefinitionId
        if (
          field.relatedEntityDefinitionId &&
          (field.dbType === "manyToOne" ||
            field.dbType === "oneToOne" ||
            field.dbType === "manyToMany" ||
            field.dbType === "oneToMany")
        ) {
          return true;
        }

        // Для обычных полей нужны готовые options
        return field.options && field.options.length > 0;
      }),
    [fields]
  );

  const searchableFields = useMemo(
    () =>
      fields.filter((field) => {
        if (field.searchable) return true;
        return false;
      }),
    [fields]
  );

  // Обработчик изменения фильтра для конкретного поля
  const handleFilterChange = (fieldName: string, value: string[]) => {
    const newFilters = { ...filters };
    if (value.length === 0) {
      delete newFilters[fieldName];
    } else {
      newFilters[fieldName] = value;
    }
    setFilters(newFilters);
    setPage(1); // Сбрасываем на первую страницу при изменении фильтров
  };

  // Обработчик изменения режима фильтрации для конкретного поля
  const handleFilterModeChange = (fieldName: string, mode: FilterMode) => {
    setFilterModes((prev) => ({ ...prev, [fieldName]: mode }));
  };

  const instances = data?.data || [];
  const pagination = data?.pagination;
  const isInitialLoading = !data && isFetching;

  return (
    <Card>
      <CardContent className="p-6">
        {/* Поиск и фильтры */}
        <div className="mb-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {searchableFields.length > 0 && (
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            )}

            {/* Фильтры */}
            {filterableFields.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {filterableFields.map((field) => (
                  <FilterField
                    key={field.name}
                    projectId={projectId}
                    field={field}
                    value={filters[field.name] || []}
                    onChange={(value) => handleFilterChange(field.name, value)}
                    filterMode={filterModes[field.name] || "any"}
                    onFilterModeChange={(mode) =>
                      handleFilterModeChange(field.name, mode)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="text-center py-8 text-destructive">
            Error loading data
          </div>
        )}

        {/* Начальная загрузка */}
        {isInitialLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : (
          <>
            {/* Таблица */}
            <div className="relative">
              {isFetching && !isInitialLoading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              {instances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        {displayFields.map((field) => (
                          <TableHead key={field.id}>{field.label}</TableHead>
                        ))}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instances.map((instance) => {
                        const name = (instance as any).name || instance.id;
                        return (
                          <TableRow key={instance.id}>
                            <TableCell>
                              <Link
                                href={`/entities/${entityDefinitionSlug}/${instance.slug}`}
                                className="text-primary hover:underline"
                              >
                                {name}
                              </Link>
                            </TableCell>
                            {displayFields.map((field) => {
                              const value = (instance as any)[field.name];
                              const isRelation =
                                field.relatedEntityDefinitionId &&
                                (field.dbType === "manyToMany" ||
                                  field.dbType === "manyToOne" ||
                                  field.dbType === "oneToMany" ||
                                  field.dbType === "oneToOne");

                              // Для релейшенов используем специальное форматирование
                              if (isRelation) {
                                return (
                                  <TableCell key={field.id}>
                                    {formatRelationValue(
                                      value,
                                      field.dbType as
                                        | "manyToOne"
                                        | "oneToOne"
                                        | "manyToMany"
                                        | "oneToMany"
                                    )}
                                  </TableCell>
                                );
                              }

                              // Для обычных полей
                              return (
                                <TableCell key={field.id}>
                                  {value !== null && value !== undefined
                                    ? String(value)
                                    : "—"}
                                </TableCell>
                              );
                            })}
                            <TableCell>
                              <Button asChild variant="outline" size="sm">
                                <Link
                                  href={`/entities/${entityDefinitionSlug}/${instance.slug}`}
                                >
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Пагинация */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} (
                  {pagination.total} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPreviousPage || isFetching}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNextPage || isFetching}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
