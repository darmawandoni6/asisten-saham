'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BookOpen, Briefcase, HelpCircle, LayoutDashboard, LifeBuoy, Search, Sparkles, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    label: 'Smart Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Portofolio & Plan',
    href: '/portfolio',
    icon: Briefcase,
  },
  {
    label: 'Recovery Engine',
    href: '/recovery',
    icon: LifeBuoy,
  },
  {
    label: 'EOD Screener',
    href: '/screener',
    icon: Search,
  },
  {
    label: 'Panduan Cara Pakai',
    href: '/guide',
    icon: HelpCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <BaseSidebar
      collapsible="none"
      className="sticky top-0 z-20 flex h-screen max-h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white shadow-xs"
    >
      {/* 1. Header (Brand Logo & Name) */}
      <SidebarHeader className="flex h-16 shrink-0 flex-row items-center gap-3 space-y-0 bg-white px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-sm font-bold tracking-tight text-slate-900">Asisten Saham</h1>
            <Badge variant="emerald" className="h-4 shrink-0 px-1.5 py-0 text-[9px] font-bold uppercase">
              IDX
            </Badge>
          </div>
          <p className="truncate text-[11px] font-medium text-slate-500">EOD Decision Copilot</p>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* 2. Scrollable Navigation Content */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup className="space-y-4 p-0">
          <div>
            <SidebarGroupLabel className="mb-1 px-3">Menu Utama</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map(item => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600',
                            )}
                          />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </div>

          {/* EOD Session Schedule Card */}
          <Card className="border-slate-200/80 bg-slate-50/80 shadow-none">
            <CardContent className="p-3">
              <div className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span>Siklus Kerja EOD</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Evaluasi otomatis aktif setiap <span className="font-semibold text-slate-800">17:30 WIB</span> setelah
                penutupan bursa IDX untuk aksi esok hari.
              </p>
            </CardContent>
          </Card>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* 3. Footer (AI Copilot Status) */}
      <SidebarFooter className="shrink-0 bg-white p-3">
        <Card className="border-slate-200/80 bg-slate-50/80 shadow-none">
          <CardContent className="p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>AI Copilot</span>
              </div>
              <Badge variant="emerald" className="h-4 px-1.5 py-0 text-[9px] font-semibold">
                Aktif
              </Badge>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Mengevaluasi closing bursa jam 17:30 WIB secara objektif.
            </p>
          </CardContent>
        </Card>
      </SidebarFooter>
    </BaseSidebar>
  );
}
