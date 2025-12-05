"use client";

import Link from "next/link";
import { Layout, Database } from "lucide-react";
import { useEntityDefinitions } from "@/components/providers/EntityDefinitionsProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { entityDefinitions } = useEntityDefinitions();
  const entityDefinitionsArray = Object.values(entityDefinitions);

  return (
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <Layout className="size-5" />
                <span className="text-lg font-bold">Starter Kit</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {entityDefinitionsArray.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Entities</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {entityDefinitionsArray.map((entityDef) => (
                  <SidebarMenuItem key={entityDef.id}>
                    <SidebarMenuButton asChild>
                      <Link href={`/entities/${entityDef.slug}`}>
                        <Database className="size-4" />
                        <span>{entityDef.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
